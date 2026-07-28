from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from backend.app.database import get_db
from backend.app.schemas import CarbonSummaryResponse
from backend.app.carbon.calculator import get_carbon_summary

router = APIRouter(prefix="/carbon", tags=["carbon"])

@router.get("/summary", response_model=CarbonSummaryResponse)
def get_carbon_tracker_summary(
    consumer_id: Optional[int] = None,
    period: str = "daily",  # daily, weekly, monthly, custom
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieves carbon footprint totals (gross, net, avoided) and renewable penetration rate.
    """
    now = datetime.now()
    start_dt = None
    end_dt = now

    if period == "daily":
        start_dt = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "weekly":
        start_dt = now - timedelta(days=7)
    elif period == "monthly":
        start_dt = now - timedelta(days=30)
    elif period == "custom":
        if not start_date or not end_date:
            raise HTTPException(
                status_code=400, 
                detail="Custom period requires both start_date and end_date (YYYY-MM-DD)."
            )
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail="Invalid date format. Use YYYY-MM-DD."
            )
    else:
        raise HTTPException(
            status_code=400, 
            detail="Invalid period. Choose: daily, weekly, monthly, or custom."
        )

    summary = get_carbon_summary(db, consumer_id, start_dt, end_dt)
    summary["period"] = period
    return summary
