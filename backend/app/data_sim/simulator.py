import math
import random
from datetime import datetime, timedelta
from backend.app.models import Consumer, Reading, WeatherReading, RenewableGeneration
from backend.app.config import settings

def get_weather_for_timestamp(dt: datetime) -> dict:
    """
    Simulates weather values based on season (month) and hour of the day.
    - Temperature: Peaks around 2-3 PM (14:00-15:00), cooler at 4-5 AM.
    - Solar Irradiance: Bell curve peaking at noon (12:00), zero between 6 PM and 6 AM.
    - Wind Speed: Diurnal pattern with random noise.
    """
    hour = dt.hour + dt.minute / 60.0
    month = dt.month

    # Seasonal temperature baseline (summer in May/June, winter in Dec/Jan)
    # Seasonal temperature shift (harmonic approximation)
    season_shift = math.sin((month - 4) * (2 * math.pi / 12)) * 6.0
    base_temp = 25.0 + season_shift  # Base temperature around 25C + seasonal wave
    
    # Daily temperature wave (peaks at 15:00, coldest at 5:00)
    daily_temp_wave = math.sin((hour - 9) * (2 * math.pi / 24)) * 5.0
    temperature = base_temp + daily_temp_wave + random.normalvariate(0, 0.5)

    # Solar Irradiance (W/m^2)
    # Peaks at 12:00, starts at 6:00, ends at 18:00
    if 6.0 <= hour <= 18.0:
        # Season factor: solar is stronger in summer, weaker in winter/monsoon
        season_solar_factor = 1.0 + 0.2 * math.sin((month - 5) * (2 * math.pi / 12))
        # Bell curve
        peak_irradiance = 800.0 * season_solar_factor
        irradiance = peak_irradiance * math.sin((hour - 6) * (math.pi / 12))
        irradiance = max(0.0, irradiance + random.normalvariate(0, 15))
    else:
        irradiance = 0.0

    # Wind Speed (m/s)
    # Average around 4 m/s, slightly higher in afternoon/evening
    base_wind = 4.0 + 1.5 * math.sin((hour - 14) * (2 * math.pi / 24))
    wind_speed = max(0.0, base_wind + random.normalvariate(0, 1.2))

    return {
        "timestamp": dt,
        "temperature": round(temperature, 2),
        "solar_irradiance": round(irradiance, 2),
        "wind_speed": round(wind_speed, 2)
    }

def get_renewable_generation(dt: datetime, weather: dict, total_capacity_kw: float) -> dict:
    """
    Calculates renewable energy generated from weather features.
    Assumes a split of total capacity (e.g., 60% solar, 40% wind).
    """
    solar_cap = total_capacity_kw * 0.6
    wind_cap = total_capacity_kw * 0.4

    # Solar generation (linear with irradiance, efficiency factor, and capacity)
    # Max solar irradiance ~ 1000 W/m^2.
    solar_kwh = (weather["solar_irradiance"] / 1000.0) * solar_cap * settings.SOLAR_EFFICIENCY
    solar_kwh = max(0.0, solar_kwh + random.normalvariate(0, 0.02 * solar_cap))

    # Wind generation (cubic power relationship with wind speed, up to cut-in / rated speeds)
    # Cut-in: 3 m/s, Rated: 12 m/s, Cut-out: 25 m/s
    ws = weather["wind_speed"]
    if ws < 3.0 or ws > 25.0:
        wind_efficiency = 0.0
    elif ws >= 12.0:
        wind_efficiency = 1.0
    else:
        # Cubic ramp between 3 and 12
        wind_efficiency = ((ws - 3) / 9) ** 3
        
    wind_kwh = wind_cap * wind_efficiency * settings.WIND_EFFICIENCY
    wind_kwh = max(0.0, wind_kwh + random.normalvariate(0, 0.02 * wind_cap))

    # 15-minute readings, so divide kW output by 4 to get kWh
    solar_kwh_15m = (solar_kwh) / 4.0
    wind_kwh_15m = (wind_kwh) / 4.0
    total_kwh_15m = solar_kwh_15m + wind_kwh_15m

    return {
        "timestamp": dt,
        "solar_kwh": round(solar_kwh_15m, 4),
        "wind_kwh": round(wind_kwh_15m, 4),
        "total_kwh": round(total_kwh_15m, 4)
    }

def get_consumer_load(dt: datetime, consumer: Consumer, weather: dict) -> dict:
    """
    Generates a realistic smart meter load reading for a consumer based on their class.
    - Residential: peaks morning (7-9 AM) and evening (6-10 PM). High temperature increases AC/heating.
    - Commercial: peaks office hours (9 AM - 6 PM). Weekend load drop.
    - Industrial: flat base load with 3 shift change drops (6 AM, 2 PM, 10 PM). Weekend partial drop.
    """
    hour = dt.hour + dt.minute / 60.0
    is_weekend = dt.weekday() >= 5
    cap = consumer.peak_capacity_kw

    # Hourly scaling factors
    if consumer.class_type.lower() == "residential":
        # Morning peak (7-9) and evening peak (18-22)
        base_factor = 0.2  # night load
        if 7.0 <= hour <= 9.0:
            base_factor = 0.65
        elif 18.0 <= hour <= 22.0:
            base_factor = 0.85
        elif 9.0 < hour < 18.0:
            base_factor = 0.45
            
        # Weekend increase
        weekend_mult = 1.15 if is_weekend else 0.95
        factor = base_factor * weekend_mult

        # Temperature sensitivity (AC cooling load above 26C, heating below 18C)
        temp = weather["temperature"]
        temp_effect = 1.0
        if temp > 26.0:
            temp_effect += (temp - 26.0) * 0.04
        elif temp < 18.0:
            temp_effect += (18.0 - temp) * 0.03
        factor *= temp_effect

    elif consumer.class_type.lower() == "commercial":
        # Working hours 9:00 - 18:00
        if 9.0 <= hour <= 18.0:
            base_factor = 0.75
        elif 8.0 <= hour < 9.0 or 18.0 < hour <= 20.0:
            base_factor = 0.4
        else:
            base_factor = 0.15 # standby
            
        # Weekend decrease (most offices closed)
        weekend_mult = 0.25 if is_weekend else 1.0
        factor = base_factor * weekend_mult

        # Heavy HVAC temperature sensitivity
        temp = weather["temperature"]
        temp_effect = 1.0
        if temp > 25.0:
            temp_effect += (temp - 25.0) * 0.06
        factor *= temp_effect

    else:  # industrial
        # 3 shifts, drops at shift change times: 06:00, 14:00, 22:00
        base_factor = 0.75
        if 5.5 <= hour <= 6.5 or 13.5 <= hour <= 14.5 or 21.5 <= hour <= 22.5:
            base_factor = 0.5  # shift change dip
            
        # Slightly lower on weekends
        weekend_mult = 0.85 if is_weekend else 1.0
        factor = base_factor * weekend_mult
        
        # Less weather-sensitive, mostly machinery driven
        temp_effect = 1.0
        factor *= temp_effect

    # Apply capacity coefficient, noise, and baseline minimum
    mean_load_kw = cap * factor
    load_kw = max(cap * 0.05, random.normalvariate(mean_load_kw, cap * 0.04))

    # Convert kW to kWh for a 15-minute interval (divide by 4)
    energy_kwh = load_kw / 4.0

    # Inject Anomaly (1.5% chance)
    is_anomaly = False
    anomaly_choice = random.random()
    if anomaly_choice < 0.015:
        is_anomaly = True
        anomaly_type = random.choice(["spike", "dropout", "shift"])
        
        if anomaly_type == "spike":
            # Surge in power (2.5x to 4x capacity)
            energy_kwh = (cap * random.uniform(2.5, 4.0)) / 4.0
        elif anomaly_type == "dropout":
            # Complete blackout or meter error
            energy_kwh = random.uniform(0.0, cap * 0.01) / 4.0
        elif anomaly_type == "shift":
            # Sustained high baseline (e.g. leakage, left equipment on)
            energy_kwh = (cap * random.uniform(1.2, 1.5)) / 4.0

    return {
        "consumer_id": consumer.id,
        "timestamp": dt,
        "energy_kwh": round(energy_kwh, 4),
        "is_anomaly": is_anomaly
    }
