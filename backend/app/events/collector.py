import uuid
import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.schema import LearningEvent

class EventCollector:
    """
    Append-only telemetry event collection system for student interactions.
    """
    VALID_EVENT_TYPES = {
        "COURSE_OPENED", "COURSE_STARTED", "COURSE_COMPLETED",
        "VIDEO_STARTED", "VIDEO_COMPLETED", "NOTE_OPENED",
        "QUESTION_STARTED", "QUESTION_ANSWERED", "QUESTION_SKIPPED", "QUESTION_REVISITED", "ANSWER_CHANGED",
        "QUIZ_STARTED", "QUIZ_COMPLETED",
        "REVISION_STARTED", "REVISION_COMPLETED",
        "MOCK_STARTED", "MOCK_COMPLETED",
        "ROADMAP_OPENED", "ROADMAP_ITEM_COMPLETED",
        "UPSC_ESSAY_SUBMITTED"
    }

    @classmethod
    def log_event(
        cls,
        db: Session,
        student_id: str,
        session_id: str,
        event_type: str,
        resource_id: Optional[str] = None,
        concept_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime.datetime] = None
    ) -> LearningEvent:
        """
        Appends a validated interaction event to the learning_events table.
        """
        event_id = f"evt_{uuid.uuid4().hex[:16]}"
        timestamp = timestamp or datetime.datetime.utcnow()

        event = LearningEvent(
            event_id=event_id,
            student_id=student_id,
            session_id=session_id,
            event_type=event_type,
            resource_id=resource_id,
            concept_id=concept_id,
            metadata_payload=metadata or {},
            timestamp=timestamp
        )
        db.add(event)
        db.flush()
        return event
