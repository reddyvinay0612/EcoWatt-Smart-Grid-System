from datetime import datetime
from backend.app.data_sim.simulator import get_weather_for_timestamp, get_renewable_generation, get_consumer_load
from backend.app.models import Consumer

def test_weather_generation():
    # 1. Midnight test
    dt_midnight = datetime(2026, 6, 21, 0, 0, 0)
    weather_midnight = get_weather_for_timestamp(dt_midnight)
    
    assert weather_midnight["solar_irradiance"] == 0.0
    assert 10.0 <= weather_midnight["temperature"] <= 35.0
    assert weather_midnight["wind_speed"] >= 0.0

    # 2. Noon test
    dt_noon = datetime(2026, 6, 21, 12, 0, 0)
    weather_noon = get_weather_for_timestamp(dt_noon)
    
    assert weather_noon["solar_irradiance"] > 100.0  # Summer noon solar
    assert weather_noon["temperature"] > weather_midnight["temperature"]  # Noon should be hotter than midnight

def test_renewable_generation():
    dt = datetime(2026, 6, 21, 12, 0, 0)
    # Clear sun, high wind
    weather = {"solar_irradiance": 800.0, "wind_speed": 10.0}
    
    renew = get_renewable_generation(dt, weather, total_capacity_kw=100.0)
    
    # 100kW capacity splits to 60kW solar and 40kW wind
    assert renew["solar_kwh"] > 0.0
    assert renew["wind_kwh"] > 0.0
    assert renew["total_kwh"] == renew["solar_kwh"] + renew["wind_kwh"]

def test_consumer_load_curves():
    dt_evening = datetime(2026, 6, 21, 19, 0, 0) # 7 PM (Residential Peak)
    weather = {"temperature": 25.0}
    
    # Create mock consumers
    res_consumer = Consumer(id=1, name="Resi Block", class_type="Residential", peak_capacity_kw=10.0, location="Loc")
    comm_consumer = Consumer(id=2, name="Office Block", class_type="Commercial", peak_capacity_kw=10.0, location="Loc")
    
    res_load = get_consumer_load(dt_evening, res_consumer, weather)
    comm_load = get_consumer_load(dt_evening, comm_consumer, weather)
    
    # At 7 PM, residential should be near its peak draw, commercial office should be in stand-by drop
    # energy_kwh is load divided by 4 for 15m intervals
    assert res_load["energy_kwh"] > comm_load["energy_kwh"]
