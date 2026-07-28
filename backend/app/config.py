from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "EcoWatt AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "supersecretkeyforecowattaidonotuseinproduction12345!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database
    # Default to local SQLite database in the workspace directory
    DATABASE_URL: str = "sqlite:///d:/Major Project/backend/ecowatt.db"

    # Simulation Settings
    SIMULATION_INTERVAL_SECONDS: int = 15  # Ingest new readings every 15s when active
    HISTORICAL_DAYS_TO_GENERATE: int = 180  # 6 months of baseline data

    # Carbon Factors (kg CO2e per kWh)
    # India CEA baseline grid emissions average is ~0.82 kgCO2/kWh
    CARBON_EMISSION_FACTOR: float = 0.82
    # Renewable capacity factor defaults
    SOLAR_EFFICIENCY: float = 0.15
    WIND_EFFICIENCY: float = 0.30

    # Currency
    CURRENCY_SYMBOL: str = "₹"
    ENERGY_COST_PER_KWH: float = 7.5  # Average cost in ₹/kWh

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
