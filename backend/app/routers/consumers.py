from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.database import get_db
from backend.app.models import Consumer
from backend.app.schemas import ConsumerCreate, ConsumerResponse
from backend.app.routers.auth import get_current_user

router = APIRouter(prefix="/consumers", tags=["consumers"])

@router.get("/", response_model=List[ConsumerResponse])
def get_consumers(db: Session = Depends(get_db)):
    """
    Returns list of all active consumers.
    """
    return db.query(Consumer).all()

@router.get("/{consumer_id}", response_model=ConsumerResponse)
def get_consumer(consumer_id: int, db: Session = Depends(get_db)):
    """
    Returns details of a specific consumer.
    """
    consumer = db.query(Consumer).filter(Consumer.id == consumer_id).first()
    if not consumer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Consumer with ID {consumer_id} not found."
        )
    return consumer

@router.post("/", response_model=ConsumerResponse, status_code=status.HTTP_201_CREATED)
def create_consumer(
    consumer: ConsumerCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Registers a new smart-meter consumer (Admin/Manager role required).
    """
    db_consumer = Consumer(**consumer.dict())
    db.add(db_consumer)
    db.commit()
    db.refresh(db_consumer)
    return db_consumer
