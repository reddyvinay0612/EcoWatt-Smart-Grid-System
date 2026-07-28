from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import numpy as np
import pandas as pd

from backend.app.database import get_db
from backend.app.models import OptimizationAction, Consumer, Reading, WeatherReading, RenewableGeneration
from backend.app.schemas import OptimizationResponse, OptimizationUpdate
from backend.app.optimize.recommender import generate_optimization_recommendations
from backend.app.optimize.q_learning import train_rl_agent
from backend.app.forecasting.xgb_model import XGBForecaster
from backend.app.data_sim.simulator import get_weather_for_timestamp
from backend.app.routers.auth import get_current_user

router = APIRouter(prefix="/optimize", tags=["optimization"])

@router.get("/recommendations", response_model=List[OptimizationResponse])
def get_recommendations(
    consumer_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieves active demand-response shifting and baseline correction recommendations.
    """
    query = db.query(OptimizationAction)
    if consumer_id is not None:
        query = query.filter(OptimizationAction.consumer_id == consumer_id)
    if status is not None:
        query = query.filter(OptimizationAction.status == status)
        
    return query.order_by(OptimizationAction.timestamp.desc()).all()

@router.post("/generate/{consumer_id}", response_model=List[OptimizationResponse])
def generate_recommendations_on_demand(
    consumer_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Triggers demand and solar forecasting to generate optimization recommendations (JWT required).
    """
    consumer = db.query(Consumer).filter(Consumer.id == consumer_id).first()
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer not found")

    # Fetch last 96 readings (24 hours) for history
    readings = db.query(Reading).filter(
        Reading.consumer_id == consumer_id
    ).order_by(Reading.timestamp.desc()).limit(150).all()
    
    if len(readings) < 96:
        raise HTTPException(status_code=400, detail="Insufficient history to perform optimization analysis.")

    # Prepare historical load df
    history_df = pd.DataFrame([{
        "timestamp": r.timestamp,
        "energy_kwh": r.energy_kwh
    } for r in reversed(readings)])

    # Fetch historical weather
    min_ts, max_ts = history_df["timestamp"].min(), history_df["timestamp"].max()
    weather = db.query(WeatherReading).filter(
        WeatherReading.timestamp >= min_ts,
        WeatherReading.timestamp <= max_ts
    ).all()
    weather_df = pd.DataFrame([{
        "timestamp": w.timestamp,
        "temperature": w.temperature,
        "solar_irradiance": w.solar_irradiance,
        "wind_speed": w.wind_speed
    } for w in weather])

    history_df = pd.merge(history_df, weather_df, on="timestamp", how="inner")

    # Future weather predictions (24 hours)
    latest_ts = history_df["timestamp"].max()
    future_weather_rows = [get_weather_for_timestamp(latest_ts + timedelta(minutes=15 * step)) for step in range(1, 97)]
    future_weather_df = pd.DataFrame(future_weather_rows)

    # 1. Forecast future load using XGBoost
    load_forecaster = XGBForecaster()
    load_forecaster.fit(history_df, target_col="energy_kwh")
    forecast_load = load_forecaster.forecast(history_df, future_weather_df, horizon=96, is_renewable=False)

    # 2. Forecast future system renewables
    # Fetch historical system-wide renewable records
    renewables = db.query(RenewableGeneration).filter(
        RenewableGeneration.timestamp >= min_ts,
        RenewableGeneration.timestamp <= max_ts
    ).all()
    renew_df = pd.DataFrame([{
        "timestamp": r.timestamp,
        "total_kwh": r.total_kwh
    } for r in renewables])
    
    renew_history_df = pd.merge(renew_df, weather_df, on="timestamp", how="inner")
    
    renew_forecaster = XGBForecaster()
    renew_forecaster.fit(renew_history_df, target_col="total_kwh", is_renewable=True)
    forecast_renewables = renew_forecaster.forecast(renew_history_df, future_weather_df, horizon=96, is_renewable=True)

    # 3. Generate recommendations
    recs = generate_optimization_recommendations(db, consumer_id, forecast_load, forecast_renewables)
    return recs

@router.put("/{action_id}", response_model=OptimizationResponse)
def update_recommendation_status(
    action_id: int,
    payload: OptimizationUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Accepts or dismisses a recommendation card (JWT required).
    """
    action = db.query(OptimizationAction).filter(OptimizationAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Optimization card not found")

    status_val = payload.status.strip()
    if status_val not in ["Pending", "Accepted", "Dismissed"]:
        raise HTTPException(status_code=400, detail="Invalid status. Choose: Pending, Accepted, Dismissed")

    action.status = status_val
    db.commit()
    db.refresh(action)
    return action

@router.get("/rl-training")
def get_rl_training_sim(episodes: int = 1000):
    """
    Executes reinforcement learning agent training and returns convergence curves.
    """
    try:
        results = train_rl_agent(episodes=episodes)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reinforcement learning simulation failed: {str(e)}"
        )
