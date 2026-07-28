from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from backend.app.database import get_db
from backend.app.models import Anomaly, Consumer
from backend.app.schemas import AnomalyResponse, AnomalyUpdate
from backend.app.anomalies.detector import AnomalyDetector, evaluate_detector_accuracy
from backend.app.routers.auth import get_current_user

router = APIRouter(prefix="/anomalies", tags=["anomalies"])

@router.get("/", response_model=List[AnomalyResponse])
def get_anomalies(
    consumer_id: Optional[int] = None, 
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns list of all flagged anomalies. Filters by consumer or status.
    """
    query = db.query(Anomaly)
    if consumer_id is not None:
        query = query.filter(Anomaly.consumer_id == consumer_id)
    if status is not None:
        query = query.filter(Anomaly.status == status)
        
    return query.order_by(Anomaly.timestamp.desc()).all()

@router.post("/detect/{consumer_id}", response_model=List[AnomalyResponse])
def run_anomaly_detection(
    consumer_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Forces the anomaly detector to analyze recent logs and generate alerts.
    """
    consumer = db.query(Consumer).filter(Consumer.id == consumer_id).first()
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer not found")

    try:
        detector = AnomalyDetector()
        new_anomalies = detector.detect_anomalies(db, consumer_id)
        return new_anomalies
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Detection run failed: {str(e)}"
        )

@router.get("/metrics/{consumer_id}")
def get_detector_accuracy(consumer_id: int, db: Session = Depends(get_db)):
    """
    Compares detected anomalies with synthetic ground truth values.
    Returns Precision, Recall, and F1 Score metrics for project audit.
    """
    consumer = db.query(Consumer).filter(Consumer.id == consumer_id).first()
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer not found")

    metrics = evaluate_detector_accuracy(db, consumer_id)
    return metrics

@router.put("/{anomaly_id}", response_model=AnomalyResponse)
def update_anomaly_status(
    anomaly_id: int,
    payload: AnomalyUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Acknowledge or dismiss a flagged anomaly (JWT required).
    """
    anomaly = db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly alert not found")

    status_val = payload.status.strip()
    if status_val not in ["Active", "Acknowledged", "Dismissed"]:
        raise HTTPException(status_code=400, detail="Invalid status. Choose: Active, Acknowledged, Dismissed")

    anomaly.status = status_val
    db.commit()
    db.refresh(anomaly)
    return anomaly
