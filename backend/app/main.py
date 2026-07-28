import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
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

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the EcoWatt AI API",
        "docs_url": "/docs",
        "status": "online"
    }
