from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
try:
    from app.database import Base
except ImportError:
    from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="manager")  # admin, manager, viewer

class Consumer(Base):
    __tablename__ = "consumers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    class_type = Column(String, nullable=False)  # Residential, Commercial, Industrial
    peak_capacity_kw = Column(Float, nullable=False)
    location = Column(String, nullable=False)

    readings = relationship("Reading", back_populates="consumer", cascade="all, delete-orphan")
    anomalies = relationship("Anomaly", back_populates="consumer", cascade="all, delete-orphan")
    forecasts = relationship("ForecastResult", back_populates="consumer", cascade="all, delete-orphan")
    optimizations = relationship("OptimizationAction", back_populates="consumer", cascade="all, delete-orphan")
    carbon_records = relationship("CarbonRecord", back_populates="consumer", cascade="all, delete-orphan")

class Reading(Base):
    __tablename__ = "readings"

    id = Column(Integer, primary_key=True, index=True)
    consumer_id = Column(Integer, ForeignKey("consumers.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)
    energy_kwh = Column(Float, nullable=False)
    is_anomaly = Column(Boolean, default=False, nullable=False)  # Hidden ground truth from simulator

    consumer = relationship("Consumer", back_populates="readings")
    
    __table_args__ = (
        UniqueConstraint("consumer_id", "timestamp", name="uq_consumer_reading"),
    )

class WeatherReading(Base):
    __tablename__ = "weather_readings"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, unique=True, index=True, nullable=False)
    temperature = Column(Float, nullable=False)  # Celsius
    solar_irradiance = Column(Float, nullable=False)  # W/m^2
    wind_speed = Column(Float, nullable=False)  # m/s

class RenewableGeneration(Base):
    __tablename__ = "renewable_generation"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, unique=True, index=True, nullable=False)
    solar_kwh = Column(Float, nullable=False)
    wind_kwh = Column(Float, nullable=False)
    total_kwh = Column(Float, nullable=False)

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    consumer_id = Column(Integer, ForeignKey("consumers.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)
    actual_value = Column(Float, nullable=False)
    predicted_value = Column(Float, nullable=True)
    anomaly_score = Column(Float, nullable=True)
    method = Column(String, nullable=False)  # Residual, IsolationForest, Combined
    severity = Column(String, nullable=False)  # Low, Medium, High
    status = Column(String, default="Active")  # Active, Acknowledged, Dismissed

    consumer = relationship("Consumer", back_populates="anomalies")

class ForecastResult(Base):
    __tablename__ = "forecast_results"

    id = Column(Integer, primary_key=True, index=True)
    consumer_id = Column(Integer, ForeignKey("consumers.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)  # Time of forecasting run
    target_time = Column(DateTime, index=True, nullable=False)  # The future time forecasted
    predicted_kwh = Column(Float, nullable=False)
    model_used = Column(String, nullable=False)  # LSTM, XGBoost, Baseline

    consumer = relationship("Consumer", back_populates="forecasts")

class OptimizationAction(Base):
    __tablename__ = "optimization_actions"

    id = Column(Integer, primary_key=True, index=True)
    consumer_id = Column(Integer, ForeignKey("consumers.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)
    recommendation = Column(String, nullable=False)
    est_cost_saving = Column(Float, nullable=False)
    est_co2_saving = Column(Float, nullable=False)
    status = Column(String, default="Pending")  # Pending, Accepted, Dismissed

    consumer = relationship("Consumer", back_populates="optimizations")

class CarbonRecord(Base):
    __tablename__ = "carbon_records"

    id = Column(Integer, primary_key=True, index=True)
    consumer_id = Column(Integer, ForeignKey("consumers.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)
    gross_emissions_kg = Column(Float, nullable=False)
    net_emissions_kg = Column(Float, nullable=False)
    avoided_emissions_kg = Column(Float, nullable=False)

    consumer = relationship("Consumer", back_populates="carbon_records")

class StateSolarAnalytics(Base):
    __tablename__ = "state_solar_analytics"

    state_id = Column(String(5), primary_key=True, index=True)
    state_name = Column(String(100), unique=True, nullable=False)
    total_households = Column(Integer, default=0, nullable=False)
    solar_installed_count = Column(Integer, default=0, nullable=False)
    total_solar_capacity_kw = Column(Float, default=0.0, nullable=False)
    avg_monthly_generation_kwh = Column(Float, default=0.0, nullable=False)
    total_electricity_optimized_kwh = Column(Float, default=0.0, nullable=False)
    non_solar_potential_kwh = Column(Float, default=0.0, nullable=False)

    districts = relationship("DistrictSolarAnalytics", back_populates="state_ref", cascade="all, delete-orphan")

class DistrictSolarAnalytics(Base):
    __tablename__ = "district_solar_analytics"

    district_id = Column(String(20), primary_key=True, index=True)
    district_name = Column(String(100), nullable=False)
    state_name = Column(String(100), ForeignKey("state_solar_analytics.state_name", ondelete="CASCADE"), nullable=False)
    total_households = Column(Integer, default=0, nullable=False)
    solar_installed_count = Column(Integer, default=0, nullable=False)
    total_solar_capacity_kw = Column(Float, default=0.0, nullable=False)
    avg_monthly_generation_kwh = Column(Float, default=0.0, nullable=False)
    total_electricity_optimized_kwh = Column(Float, default=0.0, nullable=False)
    non_solar_potential_kwh = Column(Float, default=0.0, nullable=False)

    state_ref = relationship("StateSolarAnalytics", back_populates="districts")
    pincodes = relationship("PincodeSolarAnalytics", back_populates="district_ref", cascade="all, delete-orphan")

class PincodeSolarAnalytics(Base):
    __tablename__ = "pincode_solar_analytics"

    pincode = Column(String(10), primary_key=True, index=True)
    district_id = Column(String(20), ForeignKey("district_solar_analytics.district_id", ondelete="CASCADE"), nullable=False)
    solar_installation_density_ratio = Column(Float, default=0.0, nullable=False)
    total_roof_area_sqm = Column(Float, default=0.0, nullable=False)
    estimated_unutilized_solar_capacity_kw = Column(Float, default=0.0, nullable=False)

    district_ref = relationship("DistrictSolarAnalytics", back_populates="pincodes")
    households = relationship("HouseholdSolarAnalytics", back_populates="pincode_ref", cascade="all, delete-orphan")

class HouseholdSolarAnalytics(Base):
    __tablename__ = "household_solar_analytics"

    household_id = Column(String(50), primary_key=True, index=True)
    owner_name = Column(String(150))
    pincode = Column(String(10), ForeignKey("pincode_solar_analytics.pincode", ondelete="CASCADE"), nullable=False)
    roof_polygon_wkt = Column(String)  # WKT representation of spatial polygon geometry
    usable_roof_area_sqm = Column(Float, nullable=False)
    solar_status = Column(String(20), default="NON_SOLAR", nullable=False)  # 'SOLAR', 'NON_SOLAR'
    installed_capacity_kw = Column(Float, default=0.0)
    ghi_irradiance_kwh_m2_day = Column(Float, default=4.5, nullable=False)
    monthly_grid_consumption_kwh = Column(Float, nullable=False)
    avoided_co2_kg_monthly = Column(Float, default=0.0, nullable=False)
    savings_monthly_inr = Column(Float, default=0.0, nullable=False)
    payback_years = Column(Float, nullable=True)
    recommended_capacity_kw = Column(Float, nullable=True)

    pincode_ref = relationship("PincodeSolarAnalytics", back_populates="households")

