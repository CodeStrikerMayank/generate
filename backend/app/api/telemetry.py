from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.app.database.connection import get_db
from backend.app.models.schema import LearningEvent
from backend.app.schemas.pydantic_models import TelemetryEventCreate
from backend.app.events.collector import EventCollector

router = APIRouter(prefix="/telemetry", tags=["Event Stream & Telemetry"])

@router.post("/log/{student_id}")
def log_telemetry_event(
    student_id: str,
    req: TelemetryEventCreate,
    db: Session = Depends(get_db)
):
    event = EventCollector.log_event(
        db=db,
        student_id=student_id,
        session_id=req.session_id,
        event_type=req.event_type,
        resource_id=req.resource_id,
        concept_id=req.concept_id,
        metadata=req.metadata
    )
    db.commit()
    return {"status": "LOGGED", "event_id": event.event_id, "timestamp": event.timestamp}

@router.get("/stream/{student_id}")
def get_student_event_stream(student_id: str, limit: int = 50, db: Session = Depends(get_db)):
    events = (
        db.query(LearningEvent)
        .filter(LearningEvent.student_id == student_id)
        .order_by(LearningEvent.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "event_id": e.event_id,
            "event_type": e.event_type,
            "session_id": e.session_id,
            "resource_id": e.resource_id,
            "concept_id": e.concept_id,
            "metadata": e.metadata_payload,
            "timestamp": e.timestamp
        }
        for e in events
    ]
