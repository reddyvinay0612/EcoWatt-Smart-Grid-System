import csv
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import pandas as pd

from backend.app.database import get_db
from backend.app.models import Reading, WeatherReading, RenewableGeneration, Consumer, CarbonRecord
from backend.app.data_sim.simulator import get_weather_for_timestamp, get_renewable_generation, get_consumer_load
from backend.app.carbon.calculator import calculate_carbon_for_interval
from backend.app.routers.auth import get_current_user

router = APIRouter(prefix="/data", tags=["data"])

@router.get("/history/{consumer_id}")
def get_historical_readings(
    consumer_id: int, 
    limit: int = 96,  # Default to last 24h
    db: Session = Depends(get_db)
):
    """
    Retrieves the latest consumption, weather, and renewable records for a consumer.
    """
    # 1. Fetch latest readings
    readings = db.query(Reading).filter(
        Reading.consumer_id == consumer_id
    ).order_by(Reading.timestamp.desc()).limit(limit).all()

    if not readings:
        return []

    # Reverse to keep chronological order
    readings = list(reversed(readings))
    start_ts = readings[0].timestamp
    end_ts = readings[-1].timestamp

    # 2. Fetch corresponding weather
    weather = db.query(WeatherReading).filter(
        WeatherReading.timestamp >= start_ts,
        WeatherReading.timestamp <= end_ts
    ).all()
    weather_map = {w.timestamp: w for w in weather}

    # 3. Fetch corresponding renewables
    renewables = db.query(RenewableGeneration).filter(
        RenewableGeneration.timestamp >= start_ts,
        RenewableGeneration.timestamp <= end_ts
    ).all()
    renewables_map = {r.timestamp: r for r in renewables}

    # 4. Merge results
    result = []
    for r in readings:
        w = weather_map.get(r.timestamp)
        renew = renewables_map.get(r.timestamp)
        
        result.append({
            "timestamp": r.timestamp,
            "energy_kwh": r.energy_kwh,
            "is_anomaly": r.is_anomaly,
            "temperature": w.temperature if w else 25.0,
            "solar_irradiance": w.solar_irradiance if w else 0.0,
            "wind_speed": w.wind_speed if w else 4.0,
            "solar_kwh": renew.solar_kwh if renew else 0.0,
            "wind_kwh": renew.wind_kwh if renew else 0.0,
            "total_renewable_kwh": renew.total_kwh if renew else 0.0
        })

    return result

@router.post("/simulate-step")
def simulate_live_step(db: Session = Depends(get_db)):
    """
    Trigger a single simulation step. Appends a new 15-minute readings block 
    representing live real-time ingestion.
    """
    consumers = db.query(Consumer).all()
    if not consumers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No consumers seeded. Please run seeding first."
        )

    # Get the latest reading timestamp in database to increment it by 15 mins
    latest_reading = db.query(Reading).order_by(Reading.timestamp.desc()).first()
    if latest_reading:
        next_time = latest_reading.timestamp + timedelta(minutes=15)
    else:
        next_time = datetime.now()

    # Generate system-wide weather
    weather_dict = get_weather_for_timestamp(next_time)
    weather_obj = WeatherReading(**weather_dict)
    db.add(weather_obj)

    # Generate renewable generation (capacity system = sum of peak cap * 0.25)
    total_capacity = sum(c.peak_capacity_kw for c in consumers)
    renew_dict = get_renewable_generation(next_time, weather_dict, total_capacity * 0.25)
    renew_obj = RenewableGeneration(**renew_dict)
    db.add(renew_obj)
    
    # Save weather and renewables to get IDs/flush
    db.flush()

    new_readings = []
    new_carbon = []
    
    for c in consumers:
        load_dict = get_consumer_load(next_time, c, weather_dict)
        reading_obj = Reading(**load_dict)
        new_readings.append(reading_obj)
        db.add(reading_obj)

        # Carbon metrics
        share_ratio = c.peak_capacity_kw / total_capacity
        allocated_renew = renew_dict["total_kwh"] * share_ratio
        
        carbon_calc = calculate_carbon_for_interval(load_dict["energy_kwh"], allocated_renew)
        carbon_obj = CarbonRecord(
            consumer_id=c.id,
            timestamp=next_time,
            **carbon_calc
        )
        new_carbon.append(carbon_obj)
        db.add(carbon_obj)

    db.commit()

    return {
        "timestamp": next_time,
        "consumers_updated": len(consumers),
        "weather": weather_dict,
        "renewables": renew_dict
    }

@router.post("/ingest")
def ingest_smart_meter_csv(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Ingests external smart meter reading logs via CSV file.
    CSV Schema: consumer_id, timestamp, energy_kwh
    Ex:
    1, 2026-07-22 12:00:00, 1.25
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a CSV file."
        )

    try:
        contents = file.file.read().decode("utf-8")
        csv_reader = csv.reader(io.StringIO(contents))
        
        # Verify and skip header if present
        header = next(csv_reader)
        # Check if first row is a header
        if header[0].strip().lower() == "consumer_id":
            pass
        else:
            # Re-read from beginning or add header row back to parsing
            file.file.seek(0)
            contents = file.file.read().decode("utf-8")
            csv_reader = csv.reader(io.StringIO(contents))

        records_added = 0
        duplicate_records = 0
        
        # Gather all consumer IDs for caching
        valid_consumer_ids = set(c.id for c in db.query(Consumer.id).all())
        
        for row in csv_reader:
            if not row or len(row) < 3:
                continue
                
            try:
                c_id = int(row[0].strip())
                ts_str = row[1].strip()
                kwh = float(row[2].strip())
            except ValueError:
                continue # Skip invalid rows

            if c_id not in valid_consumer_ids:
                # Ignore readings for unknown consumers
                continue
                
            # Parse timestamp (supports multiple common formats)
            parsed_ts = None
            for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S", "%d-%m-%Y %H:%M"):
                try:
                    parsed_ts = datetime.strptime(ts_str, fmt)
                    break
                except ValueError:
                    continue
                    
            if not parsed_ts:
                continue # Skip if date format cannot be resolved

            # Check if this reading already exists
            existing = db.query(Reading).filter(
                Reading.consumer_id == c_id,
                Reading.timestamp == parsed_ts
            ).first()
            
            if existing:
                duplicate_records += 1
                continue

            # Ensure we have weather for this timestamp
            weather = db.query(WeatherReading).filter(WeatherReading.timestamp == parsed_ts).first()
            if not weather:
                # Generate synthetic weather for this period on the fly
                weather_dict = get_weather_for_timestamp(parsed_ts)
                weather = WeatherReading(**weather_dict)
                db.add(weather)
                
                # Generate renewable generation for this period
                total_capacity = sum(c.peak_capacity_kw for c in db.query(Consumer).all())
                renew_dict = get_renewable_generation(parsed_ts, weather_dict, total_capacity * 0.25)
                renew = RenewableGeneration(**renew_dict)
                db.add(renew)
                db.flush()

            # Create Reading
            reading = Reading(
                consumer_id=c_id,
                timestamp=parsed_ts,
                energy_kwh=kwh,
                is_anomaly=False
            )
            db.add(reading)

            # Recalculate carbon emissions
            renew_data = db.query(RenewableGeneration).filter(RenewableGeneration.timestamp == parsed_ts).first()
            total_capacity = sum(c.peak_capacity_kw for c in db.query(Consumer).all())
            consumer_obj = db.query(Consumer).filter(Consumer.id == c_id).first()
            
            share_ratio = consumer_obj.peak_capacity_kw / total_capacity
            allocated_renew = renew_data.total_kwh * share_ratio if renew_data else 0.0

            carbon_calc = calculate_carbon_for_interval(kwh, allocated_renew)
            carbon_rec = CarbonRecord(
                consumer_id=c_id,
                timestamp=parsed_ts,
                **carbon_calc
            )
            db.add(carbon_rec)

            records_added += 1

        db.commit()
        return {
            "status": "success",
            "records_ingested": records_added,
            "duplicates_skipped": duplicate_records
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during ingestion: {str(e)}"
        )
