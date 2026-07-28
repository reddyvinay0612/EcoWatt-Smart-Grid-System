from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

# --- Token & User ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "manager"

class UserResponse(UserBase):
    id: int
    role: str

    class Config:
        from_attributes = True

# --- Consumer ---
class ConsumerBase(BaseModel):
    name: str
    class_type: str
    peak_capacity_kw: float
    location: str

class ConsumerCreate(ConsumerBase):
    pass

class ConsumerResponse(ConsumerBase):
    id: int

    class Config:
        from_attributes = True

# --- Reading ---
class ReadingBase(BaseModel):
    consumer_id: int
    timestamp: datetime
    energy_kwh: float

class ReadingCreate(ReadingBase):
    is_anomaly: Optional[bool] = False

class ReadingResponse(ReadingBase):
    id: int
    is_anomaly: bool

    class Config:
        from_attributes = True

# --- Weather ---
class WeatherBase(BaseModel):
    timestamp: datetime
    temperature: float
    solar_irradiance: float
    wind_speed: float

class WeatherCreate(WeatherBase):
    pass

class WeatherResponse(WeatherBase):
    id: int

    class Config:
        from_attributes = True

# --- Renewable Generation ---
class RenewableBase(BaseModel):
    timestamp: datetime
    solar_kwh: float
    wind_kwh: float
    total_kwh: float

class RenewableCreate(RenewableBase):
    pass

class RenewableResponse(RenewableBase):
    id: int

    class Config:
        from_attributes = True

# --- Anomaly ---
class AnomalyBase(BaseModel):
    consumer_id: int
    timestamp: datetime
    actual_value: float
    predicted_value: Optional[float] = None
    anomaly_score: Optional[float] = None
    method: str
    severity: str
    status: str

class AnomalyResponse(AnomalyBase):
    id: int
    consumer: ConsumerResponse

    class Config:
        from_attributes = True

class AnomalyUpdate(BaseModel):
    status: str = Field(..., description="Active, Acknowledged, or Dismissed")

# --- Forecasting ---
class ForecastResponse(BaseModel):
    consumer_id: int
    timestamp: datetime
    target_time: datetime
    predicted_kwh: float
    model_used: str

    class Config:
        from_attributes = True

class ModelMetrics(BaseModel):
    model: str
    mae: float
    rmse: float
    mape: float

class ForecastCompareResponse(BaseModel):
    consumer_id: int
    target_time: datetime
    actual_kwh: Optional[float] = None
    predictions: dict  # Format: {"lstm": value, "xgboost": value, "baseline": value}

# --- Carbon Tracker ---
class CarbonRecordBase(BaseModel):
    consumer_id: int
    timestamp: datetime
    gross_emissions_kg: float
    net_emissions_kg: float
    avoided_emissions_kg: float

class CarbonRecordResponse(CarbonRecordBase):
    id: int

    class Config:
        from_attributes = True

class CarbonSummaryResponse(BaseModel):
    consumer_id: Optional[int] = None
    period: str
    total_energy_kwh: float
    total_renewable_kwh: float
    gross_emissions_kg: float
    net_emissions_kg: float
    avoided_emissions_kg: float
    renewable_penetration_rate: float  # percentage

# --- Optimization ---
class OptimizationBase(BaseModel):
    consumer_id: int
    timestamp: datetime
    recommendation: str
    est_cost_saving: float
    est_co2_saving: float
    status: str

class OptimizationResponse(OptimizationBase):
    id: int
    consumer: ConsumerResponse

    class Config:
        from_attributes = True

class OptimizationUpdate(BaseModel):
    status: str = Field(..., description="Pending, Accepted, or Dismissed")
