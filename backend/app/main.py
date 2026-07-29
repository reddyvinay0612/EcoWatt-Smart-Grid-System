import logging
import pickle
import os
import pandas as pd
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from scipy.optimize import minimize
import contextlib

from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.routers import auth, consumers, data, forecast, anomalies, carbon, optimize
from backend.app.routers.data import simulate_live_step

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize DB tables
Base.metadata.create_all(bind=engine)

# Scheduler for live simulation
scheduler = BackgroundScheduler()

def live_simulation_job():
    """
    Background job that simulates a new 15-minute smart meter ingestion tick.
    """
    db = SessionLocal()
    try:
        logger.info("Executing background simulation tick...")
        result = simulate_live_step(db)
        logger.info(f"Simulated live step successfully at {result['timestamp']}")
    except Exception as e:
        logger.error(f"Error in background simulation tick: {str(e)}")
    finally:
        db.close()

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start APScheduler
    logger.info("Starting background scheduler...")
    # Add job to run every N seconds
    scheduler.add_job(
        live_simulation_job, 
        "interval", 
        seconds=settings.SIMULATION_INTERVAL_SECONDS,
        id="live_sim"
    )
    scheduler.start()
    yield
    # Shutdown: Stop scheduler
    logger.info("Shutting down background scheduler...")
    scheduler.shutdown()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set CORS origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow React frontend or other origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(consumers.router, prefix=settings.API_V1_STR)
app.include_router(data.router, prefix=settings.API_V1_STR)
app.include_router(forecast.router, prefix=settings.API_V1_STR)
app.include_router(anomalies.router, prefix=settings.API_V1_STR)
app.include_router(carbon.router, prefix=settings.API_V1_STR)
app.include_router(optimize.router, prefix=settings.API_V1_STR)

# Historical state baseline dataset for optimization lookup
STATE_BASE_DATA = {
  "andamanandnicobarislands": {"electricity_consumption": 900, "carbon_emission": 810},
  "andhrapradesh": {"electricity_consumption": 2299.25, "carbon_emission": 1954.36},
  "arunachalpradesh": {"electricity_consumption": 2562.09, "carbon_emission": 1024.84},
  "assam": {"electricity_consumption": 1069.96, "carbon_emission": 962.96},
  "bihar": {"electricity_consumption": 835.03, "carbon_emission": 793.28},
  "chandigarh": {"electricity_consumption": 2000, "carbon_emission": 1600.00},
  "chhattisgarh": {"electricity_consumption": 3105.21, "carbon_emission": 3260.47},
  "dadraandnagarhaveli": {"electricity_consumption": 15642.35, "carbon_emission": 14860.23},
  "damananddiu": {"electricity_consumption": 15642.35, "carbon_emission": 14860.23},
  "delhi": {"electricity_consumption": 3636.70, "carbon_emission": 3454.87},
  "goa": {"electricity_consumption": 5485.87, "carbon_emission": 4937.28},
  "gujarat": {"electricity_consumption": 4646.19, "carbon_emission": 4413.88},
  "haryana": {"electricity_consumption": 4875.30, "carbon_emission": 4631.54},
  "himachalpradesh": {"electricity_consumption": 3214.53, "carbon_emission": 1125.09},
  "jammuandkashmir": {"electricity_consumption": 2452.77, "carbon_emission": 1226.39},
  "jharkhand": {"electricity_consumption": 1760.78, "carbon_emission": 1848.82},
  "karnataka": {"electricity_consumption": 3357.58, "carbon_emission": 1678.79},
  "kerala": {"electricity_consumption": 2486.49, "carbon_emission": 1367.57},
  "ladakh": {"electricity_consumption": 2000, "carbon_emission": 1000.00},
  "lakshadweep": {"electricity_consumption": 800, "carbon_emission": 720.00},
  "madhyapradesh": {"electricity_consumption": 1958.49, "carbon_emission": 1762.64},
  "maharashtra": {"electricity_consumption": 2990.07, "carbon_emission": 2541.56},
  "manipur": {"electricity_consumption": 1370.01, "carbon_emission": 822.01},
  "meghalaya": {"electricity_consumption": 2688.86, "carbon_emission": 1344.43},
  "mizoram": {"electricity_consumption": 2024.78, "carbon_emission": 1113.63},
  "nagaland": {"electricity_consumption": 1079.26, "carbon_emission": 647.56},
  "odisha": {"electricity_consumption": 2598.14, "carbon_emission": 2728.05},
  "puducherry": {"electricity_consumption": 4479.88, "carbon_emission": 4031.89},
  "punjab": {"electricity_consumption": 4120.51, "carbon_emission": 3708.46},
  "rajasthan": {"electricity_consumption": 2544.64, "carbon_emission": 2417.41},
  "sikkim": {"electricity_consumption": 2863.31, "carbon_emission": 858.99},
  "tamilnadu": {"electricity_consumption": 3659.96, "carbon_emission": 2561.97},
  "telangana": {"electricity_consumption": 4162.38, "carbon_emission": 3954.26},
  "tripura": {"electricity_consumption": 1102.52, "carbon_emission": 882.02},
  "uttarpradesh": {"electricity_consumption": 1502.60, "carbon_emission": 1352.34},
  "uttarakhand": {"electricity_consumption": 2974.95, "carbon_emission": 1338.73},
  "westbengal": {"electricity_consumption": 1508.41, "carbon_emission": 1433.00}
}

def predict_future(model, periods=5):
    future = model.make_future_dataframe(periods=periods, freq="Y")
    forecast = model.predict(future)
    # Format ds to string e.g. "2026", "2027" for clean React graphing
    forecast["ds"] = forecast["ds"].dt.strftime("%Y")
    return forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]]

def optimize_energy_mix(current_consumption, current_emission, budget_constraint):
    # x = [solar, efficiency, demand_shift]
    def objective(x):
        solar, efficiency, demand_shift = x
        projected_emission = current_emission * (1 - solar * 0.40 - efficiency * 0.15 - demand_shift * 0.05)
        return projected_emission

    constraints = [
        {"type": "ineq", "fun": lambda x: budget_constraint - (x[0]*50 + x[1]*30 + x[2]*20)}
    ]
    bounds = [(0, 1), (0, 1), (0, 1)]
    result = minimize(objective, x0=[0.3, 0.3, 0.3], bounds=bounds, constraints=constraints)
    
    rates = result.x
    projected_consumption = current_consumption * (1 - rates[1] * 0.15 - rates[2] * 0.05)
    return rates, result.fun, projected_consumption

@app.get("/predict/{state}/{metric}")
def predict(state: str, metric: str, years_ahead: int = 5):
    state_key = state.lower().replace(" ", "").replace("&", "and")
    metric_key = "electricity" if "elec" in metric.lower() else "carbon"
    
    # Calculate absolute path relative to this file's folder to support parent-directory launching
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, "models")
    model_path = os.path.join(models_dir, f"{state_key}_{metric_key}_model.pkl")
    
    if not os.path.exists(model_path):
        raise HTTPException(
            status_code=404, 
            detail=f"Forecasting model not trained for state '{state}' yet."
        )
        
    try:
        with open(model_path, "rb") as f:
            model = pickle.load(f)
        forecast = predict_future(model, periods=years_ahead)
        return forecast.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Prediction calculation failed: {str(e)}"
        )

@app.get("/optimize/{state}")
def optimize(state: str, budget: float = 100):
    state_key = state.lower().replace(" ", "").replace("&", "and")
    if state_key not in STATE_BASE_DATA:
        raise HTTPException(
            status_code=404, 
            detail=f"Baseline data not available for state '{state}'."
        )
        
    current_data = STATE_BASE_DATA[state_key]
    rates, projected_emission, projected_consumption = optimize_energy_mix(
        current_data["electricity_consumption"],
        current_data["carbon_emission"],
        budget
    )
    return {
        "recommended_solar_adoption": float(rates[0]),
        "recommended_efficiency_upgrade": float(rates[1]),
        "recommended_demand_shift": float(rates[2]),
        "current_emission": float(current_data["carbon_emission"]),
        "projected_emission": float(projected_emission),
        "current_consumption": float(current_data["electricity_consumption"]),
        "projected_consumption": float(projected_consumption)
    }

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the EcoWatt AI API",
        "docs_url": "/docs",
        "status": "online"
    }
