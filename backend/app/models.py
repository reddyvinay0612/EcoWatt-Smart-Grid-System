from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
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
