import sys
import os
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
import hashlib
import os

# Set up path to import app modules correctly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from backend.app.database import Base, engine, SessionLocal
from backend.app.config import settings
from backend.app.models import User, Consumer, Reading, WeatherReading, RenewableGeneration, CarbonRecord
from backend.app.data_sim.simulator import get_weather_for_timestamp, get_renewable_generation, get_consumer_load

def get_password_hash(password: str) -> str:
    salt = os.urandom(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return f"{salt.hex()}:{pwd_hash.hex()}"

def seed_users(db: Session):
    print("Seeding users...")
    admin_exists = db.query(User).filter(User.username == "admin").first()
    if not admin_exists:
        hashed_password = get_password_hash("admin123")
        admin = User(
            username="admin",
            hashed_password=hashed_password,
            role="admin"
        )
        db.add(admin)
        db.commit()
        print("Default admin created: admin / admin123")
    else:
        print("Admin user already exists.")

def seed_consumers(db: Session) -> list:
    print("Seeding consumers...")
    consumers = db.query(Consumer).all()
    if consumers:
        print(f"Consumers already seeded ({len(consumers)} found).")
        return consumers

    # Define 15 consumers
    consumer_data = [
        # Residential (Peak cap: 5 - 15 kW)
        {"name": "Greenwood Apartment Block A", "class_type": "Residential", "peak_capacity_kw": 12.0, "location": "Sector 15, Noida"},
        {"name": "Greenwood Apartment Block B", "class_type": "Residential", "peak_capacity_kw": 10.0, "location": "Sector 15, Noida"},
        {"name": "Rosewood Villa 04", "class_type": "Residential", "peak_capacity_kw": 6.0, "location": "Whitefield, Bengaluru"},
        {"name": "Orchid Heights Residential Complex", "class_type": "Residential", "peak_capacity_kw": 25.0, "location": "Gachibowli, Hyderabad"},
        {"name": "Lakeside Rowhouse Block", "class_type": "Residential", "peak_capacity_kw": 15.0, "location": "Powai, Mumbai"},
        {"name": "Sukhna Enclave Villa Block", "class_type": "Residential", "peak_capacity_kw": 18.0, "location": "Sector 9, Chandigarh"},
        
        # Commercial (Peak cap: 30 - 100 kW)
        {"name": "TechPark Tower 1 Offices", "class_type": "Commercial", "peak_capacity_kw": 80.0, "location": "Electronics City, Bengaluru"},
        {"name": "Grand Plaza Shopping Mall", "class_type": "Commercial", "peak_capacity_kw": 150.0, "location": "Vasant Kunj, Delhi"},
        {"name": "Apollo Care Diagnostic Center", "class_type": "Commercial", "peak_capacity_kw": 40.0, "location": "Salt Lake, Kolkata"},
        {"name": "Co-Work Station Hub", "class_type": "Commercial", "peak_capacity_kw": 30.0, "location": "HSR Layout, Bengaluru"},
        {"name": "Imperial Grand Hotel", "class_type": "Commercial", "peak_capacity_kw": 90.0, "location": "Marine Drive, Mumbai"},
        {"name": "Desert Rose Heritage Resort", "class_type": "Commercial", "peak_capacity_kw": 70.0, "location": "Amer Road, Jaipur"},
        {"name": "Sabarmati Tech City Block C", "class_type": "Commercial", "peak_capacity_kw": 110.0, "location": "GIFT City, Ahmedabad"},

        # Industrial (Peak cap: 200 - 800 kW)
        {"name": "Apex Steel Casting Plant", "class_type": "Industrial", "peak_capacity_kw": 500.0, "location": "Peenya Industrial Area, Bengaluru"},
        {"name": "Hindustan Cotton Spinning Mill", "class_type": "Industrial", "peak_capacity_kw": 300.0, "location": "Tiruppur, Tamil Nadu"},
        {"name": "Precision Automobile Stamping", "class_type": "Industrial", "peak_capacity_kw": 600.0, "location": "Chakan, Pune"},
        {"name": "Standard Plastic Molding Corp", "class_type": "Industrial", "peak_capacity_kw": 250.0, "location": "Sriperumbudur, Chennai"},
        {"name": "Delta Pharma Formulation Lab", "class_type": "Industrial", "peak_capacity_kw": 400.0, "location": "Baddi, Himachal Pradesh"},
        {"name": "Spice Route Seafood Cold Storage", "class_type": "Industrial", "peak_capacity_kw": 200.0, "location": "Kochi Port, Kerala"},
        {"name": "Vizag Smart Port Warehouse", "class_type": "Industrial", "peak_capacity_kw": 350.0, "location": "Harbour Road, Visakhapatnam"},

    ]

    consumers = []
    for c in consumer_data:
        consumer = Consumer(**c)
        db.add(consumer)
        consumers.append(consumer)
    db.commit()
    print(f"Successfully seeded {len(consumers)} consumers.")
    return consumers

def generate_historical_data(db: Session, consumers: list, days: int = 180):
    """
    Generates 6 months of 15-minute readings for weather, renewables, smart meters, and carbon footprints.
    Optimized via bulk database transactions.
    """
    print(f"Generating {days} days of historical data (15-min intervals)...")
    
    # Check if we already have readings
    existing_count = db.query(Reading).count()
    if existing_count > 10000:
        print(f"Database already contains {existing_count} readings. Skipping generation.")
        return

    start_date = datetime.now() - timedelta(days=days)
    # Round to start of hour
    start_date = start_date.replace(minute=0, second=0, microsecond=0)
    
    total_intervals = days * 24 * 4
    current_time = start_date

    # Sum of capacities for proportional renewable distribution
    total_capacity = sum(c.peak_capacity_kw for c in consumers)
    
    # System-wide renewable generator capacity (e.g. 20% of total grid demand)
    renewable_capacity_system = total_capacity * 0.25

    print(f"Total Grid peak capacity: {total_capacity:.2f} kW. System renewable capacity: {renewable_capacity_system:.2f} kW.")

    # We will accumulate mappings in batches to avoid high memory footprint
    batch_size = 5000
    readings_batch = []
    weather_batch = []
    renewable_batch = []
    carbon_batch = []

    db_counter = 0

    print("Beginning generation loop...")
    for step in range(total_intervals):
        dt = current_time + timedelta(minutes=15 * step)
        
        # 1. Weather
        weather = get_weather_for_timestamp(dt)
        weather_batch.append(weather)

        # 2. Renewable Generation
        renewables = get_renewable_generation(dt, weather, renewable_capacity_system)
        renewable_batch.append(renewables)

        # 3. Consumer Readings and Carbon Records
        for consumer in consumers:
            reading = get_consumer_load(dt, consumer, weather)
            readings_batch.append(reading)

            # Calculate Carbon metrics
            # Share of renewables allocated based on consumer peak capacity share
            share_ratio = consumer.peak_capacity_kw / total_capacity
            allocated_renew_kwh = renewables["total_kwh"] * share_ratio

            energy_kwh = reading["energy_kwh"]
            gross = energy_kwh * settings.CARBON_EMISSION_FACTOR
            avoided = min(energy_kwh, allocated_renew_kwh) * settings.CARBON_EMISSION_FACTOR
            net = max(0.0, energy_kwh - allocated_renew_kwh) * settings.CARBON_EMISSION_FACTOR

            carbon_record = {
                "consumer_id": consumer.id,
                "timestamp": dt,
                "gross_emissions_kg": round(gross, 4),
                "net_emissions_kg": round(net, 4),
                "avoided_emissions_kg": round(avoided, 4)
            }
            carbon_batch.append(carbon_record)

        # Bulk save once batch is full
        if len(readings_batch) >= batch_size:
            db.bulk_insert_mappings(WeatherReading, weather_batch)
            db.bulk_insert_mappings(RenewableGeneration, renewable_batch)
            db.bulk_insert_mappings(Reading, readings_batch)
            db.bulk_insert_mappings(CarbonRecord, carbon_batch)
            db.commit()

            weather_batch.clear()
            renewable_batch.clear()
            readings_batch.clear()
            carbon_batch.clear()
            
            db_counter += batch_size
            if db_counter % 20000 == 0:
                percent = (step / total_intervals) * 100
                print(f"Generated {db_counter} records ({percent:.1f}% complete)...")

    # Insert remaining records
    if readings_batch:
        db.bulk_insert_mappings(WeatherReading, weather_batch)
        db.bulk_insert_mappings(RenewableGeneration, renewable_batch)
        db.bulk_insert_mappings(Reading, readings_batch)
        db.bulk_insert_mappings(CarbonRecord, carbon_batch)
        db.commit()

    print("Historical data generation completed successfully!")

def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_users(db)
        consumers = seed_consumers(db)
        # Generate 180 days (6 months) of data
        generate_historical_data(db, consumers, days=settings.HISTORICAL_DAYS_TO_GENERATE)
    finally:
        db.close()

if __name__ == "__main__":
    main()
