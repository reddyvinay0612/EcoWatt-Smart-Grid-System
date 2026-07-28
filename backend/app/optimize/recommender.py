import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from backend.app.models import OptimizationAction, Reading, WeatherReading, Consumer
from backend.app.config import settings

def generate_optimization_recommendations(
    db: Session, 
    consumer_id: int,
    forecast_kwh: np.ndarray,          # Array of 24 future hours or 96 15m intervals
    forecast_renewables_kwh: np.ndarray # Array of 24 future renewable energy intervals
) -> List[OptimizationAction]:
    """
    Analyzes forecasts to generate optimization alerts/recommendations.
    Saves recommendations to the database if they don't already exist for this day.
    """
    recommendations = []
    
    # Fetch consumer details
    consumer = db.query(Consumer).filter(Consumer.id == consumer_id).first()
    if not consumer:
        return []

    # Prepare historical baseline
    # Fetch last 7 days of readings to compute daily average
    seven_days_ago = datetime.now() - timedelta(days=7)
    hist_readings = db.query(Reading).filter(
        Reading.consumer_id == consumer_id,
        Reading.timestamp >= seven_days_ago
    ).all()
    
    # Calculate load shifting recommendation (if forecast arrays are available)
    if len(forecast_kwh) >= 24:
        # Reshape to 24 hourly values if 15m intervals are passed
        if len(forecast_kwh) == 96:
            hourly_load = [sum(forecast_kwh[i:i+4]) for i in range(0, 96, 4)]
            hourly_renew = [sum(forecast_renewables_kwh[i:i+4]) for i in range(0, 96, 4)]
        else:
            hourly_load = forecast_kwh
            hourly_renew = forecast_renewables_kwh

        # Find peak load hours (top 4 hours of consumption)
        peak_hours = np.argsort(hourly_load)[-4:]
        
        # Find peak renewable generation hours (between 10 AM and 3 PM)
        solar_hours = [10, 11, 12, 13, 14, 15]
        
        # Check if peak load hours fall outside peak solar hours
        non_solar_peaks = [h for h in peak_hours if h not in solar_hours]
        
        if non_solar_peaks:
            # Recommend shifting 15% of peak load to mid-day solar window
            shift_percentage = 0.15
            peak_hour_to_shift = non_solar_peaks[-1]  # Choose highest non-solar peak
            load_to_shift = hourly_load[peak_hour_to_shift] * shift_percentage
            
            # Peak rate = ₹10.5/kWh, Solar rate = ₹5.5/kWh (Diff: ₹5.0/kWh saving)
            rate_diff = 5.0
            cost_saving = load_to_shift * rate_diff
            co2_saving = load_to_shift * settings.CARBON_EMISSION_FACTOR
            
            rec_text = (
                f"Peak demand alert at {peak_hour_to_shift:02d}:00. "
                f"Shift {load_to_shift:.2f} kWh (15%) of schedulable load (e.g. heating, washing, thermal systems) "
                f"to peak solar hours (11:00-14:00) to maximize self-consumption of renewable energy."
            )
            
            # Check if this recommendation was already generated in the last 12 hours
            twelve_hours_ago = datetime.now() - timedelta(hours=12)
            existing = db.query(OptimizationAction).filter(
                OptimizationAction.consumer_id == consumer_id,
                OptimizationAction.timestamp >= twelve_hours_ago,
                OptimizationAction.recommendation.like("%Peak demand alert%")
            ).first()
            
            if not existing:
                opt = OptimizationAction(
                    consumer_id=consumer_id,
                    timestamp=datetime.now(),
                    recommendation=rec_text,
                    est_cost_saving=float(round(cost_saving, 2)),
                    est_co2_saving=float(round(co2_saving, 2)),
                    status="Pending"
                )
                db.add(opt)
                recommendations.append(opt)

    # Calculate baseline deviation recommendation
    if len(hist_readings) >= 100:
        hist_df = pd.DataFrame([{"timestamp": r.timestamp, "energy_kwh": r.energy_kwh} for r in hist_readings])
        hist_df["hour"] = hist_df["timestamp"].dt.hour
        
        # Calculate hourly mean baseline
        baseline_by_hour = hist_df.groupby("hour")["energy_kwh"].mean()
        
        # Get last 24 hours of readings
        last_24h_readings = hist_df.sort_values("timestamp").iloc[-96:]
        last_24h_grouped = last_24h_readings.groupby("hour")["energy_kwh"].mean()
        
        # Find hours where current load > 1.35x average baseline load
        excessive_hours = []
        for hr in range(24):
            if hr in last_24h_grouped.index and hr in baseline_by_hour.index:
                curr = last_24h_grouped[hr]
                base = baseline_by_hour[hr]
                if curr > base * 1.35 and base > 0.1:
                    excessive_hours.append((hr, curr - base))
                    
        if excessive_hours:
            # Take the hour with the maximum absolute excess
            excessive_hours.sort(key=lambda x: x[1], reverse=True)
            worst_hour, excess_kwh = excessive_hours[0]
            
            # Estimate savings if excess is cut back to normal baseline
            cost_saving = excess_kwh * settings.ENERGY_COST_PER_KWH
            co2_saving = excess_kwh * settings.CARBON_EMISSION_FACTOR
            
            rec_text = (
                f"Sustained baseline deviation detected at {worst_hour:02d}:00. "
                f"Consumption is {((excess_kwh + baseline_by_hour[worst_hour]) / baseline_by_hour[worst_hour] * 100 - 100):.1f}% "
                f"higher than historical baseline. Inspect HVAC schedules or check for idle loads left on."
            )
            
            # Avoid duplicate warnings in the last 12 hours
            twelve_hours_ago = datetime.now() - timedelta(hours=12)
            existing = db.query(OptimizationAction).filter(
                OptimizationAction.consumer_id == consumer_id,
                OptimizationAction.timestamp >= twelve_hours_ago,
                OptimizationAction.recommendation.like("%deviation detected%")
            ).first()
            
            if not existing:
                opt = OptimizationAction(
                    consumer_id=consumer_id,
                    timestamp=datetime.now(),
                    recommendation=rec_text,
                    est_cost_saving=float(round(cost_saving, 2)),
                    est_co2_saving=float(round(co2_saving, 2)),
                    status="Pending"
                )
                db.add(opt)
                recommendations.append(opt)
                
    if recommendations:
        db.commit()
        
    return recommendations
