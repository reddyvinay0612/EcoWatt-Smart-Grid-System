from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from backend.app.models import CarbonRecord, Reading, RenewableGeneration
from backend.app.config import settings

def calculate_carbon_for_interval(energy_kwh: float, renewable_kwh: float) -> Dict[str, float]:
    """
    Computes gross, avoided, and net carbon emissions for a specific energy and renewable interval reading.
    """
    factor = settings.CARBON_EMISSION_FACTOR
    
    gross = energy_kwh * factor
    avoided = min(energy_kwh, renewable_kwh) * factor
    net = max(0.0, energy_kwh - renewable_kwh) * factor
    
    return {
        "gross_emissions_kg": round(gross, 4),
        "avoided_emissions_kg": round(avoided, 4),
        "net_emissions_kg": round(net, 4)
    }

def get_carbon_summary(
    db: Session, 
    consumer_id: Optional[int] = None, 
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Queries and aggregates carbon metrics over a specified date range.
    If consumer_id is None, aggregates system-wide.
    """
    # 1. Base query for carbon records
    carbon_q = db.query(
        func.sum(CarbonRecord.gross_emissions_kg).label("gross"),
        func.sum(CarbonRecord.net_emissions_kg).label("net"),
        func.sum(CarbonRecord.avoided_emissions_kg).label("avoided")
    )
    
    # 2. Base query for total load consumption
    load_q = db.query(func.sum(Reading.energy_kwh).label("total_load"))

    # Apply filters
    if consumer_id is not None:
        carbon_q = carbon_q.filter(CarbonRecord.consumer_id == consumer_id)
        load_q = load_q.filter(Reading.consumer_id == consumer_id)
        
    if start_date is not None:
        carbon_q = carbon_q.filter(CarbonRecord.timestamp >= start_date)
        load_q = load_q.filter(Reading.timestamp >= start_date)
        
    if end_date is not None:
        carbon_q = carbon_q.filter(CarbonRecord.timestamp <= end_date)
        load_q = load_q.filter(Reading.timestamp <= end_date)

    carbon_res = carbon_q.first()
    load_res = load_q.first()

    gross = carbon_res.gross or 0.0
    net = carbon_res.net or 0.0
    avoided = carbon_res.avoided or 0.0
    total_load = load_res.total_load or 0.0

    # Calculate renewable usage (avoided emissions / factor)
    renewable_used = avoided / settings.CARBON_EMISSION_FACTOR
    
    penetration_rate = 0.0
    if total_load > 0:
        penetration_rate = (renewable_used / total_load) * 100.0

    return {
        "consumer_id": consumer_id,
        "total_energy_kwh": round(total_load, 2),
        "total_renewable_kwh": round(renewable_used, 2),
        "gross_emissions_kg": round(gross, 2),
        "net_emissions_kg": round(net, 2),
        "avoided_emissions_kg": round(avoided, 2),
        "renewable_penetration_rate": round(penetration_rate, 2)
    }
