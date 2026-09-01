import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.app.database.connection import get_db
from backend.app.models.schema import Roadmap, RoadmapAction, Concept, Chapter, Subject, Topic, Student
from backend.app.schemas.pydantic_models import RoadmapResponse, NextActionResponse, WeaknessDetail, PriorityItem
from backend.app.roadmap.next_action import NextActionEngine
from backend.app.roadmap.generator import RoadmapGenerator
from backend.app.roadmap.weakness import WeaknessDetector
from backend.app.roadmap.priority import PriorityEngine
from backend.app.events.collector import EventCollector

router = APIRouter(prefix="/roadmap", tags=["Dynamic Roadmap & Intelligence"])

@router.get("/active/{student_id}", response_model=RoadmapResponse)
def get_active_roadmap(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    next_engine = NextActionEngine(db)
    nba = next_engine.get_next_best_action(student_id)

    active_rm = (
        db.query(Roadmap)
        .filter(Roadmap.student_id == student_id, Roadmap.status == "ACTIVE")
        .order_by(Roadmap.version.desc())
        .first()
    )

    if not active_rm:
        generator = RoadmapGenerator(db, exam_id=student.target_exam)
        active_rm = generator.generate_roadmap(student_id, trigger_event="API_REQUEST")

    actions_list = []
    for act in active_rm.actions:
        concept = db.query(Concept).filter(Concept.concept_id == act.concept_id).first()
        topic = concept.topic if concept else None
        chapter = topic.chapter if topic else None
        subject = chapter.subject if chapter else None

        actions_list.append({
            "sequence_order": act.sequence_order,
            "action_type": act.action_type,
            "concept_id": act.concept_id,
            "concept_name": concept.name if concept else act.concept_id,
            "subject": subject.name if subject else "General",
            "priority_score": act.priority_score,
            "reasons": act.reasons or [],
            "target_questions_count": act.target_questions_count,
            "estimated_minutes": act.estimated_minutes,
            "target_difficulty": act.target_difficulty,
            "is_completed": act.is_completed
        })

    return RoadmapResponse(
        roadmap_id=active_rm.roadmap_id,
        student_id=student_id,
        version=active_rm.version,
        created_at=active_rm.created_at,
        next_best_action=nba,
        actions=actions_list
    )

@router.get("/next-action/{student_id}", response_model=NextActionResponse)
def get_next_action(student_id: str, db: Session = Depends(get_db)):
    next_engine = NextActionEngine(db)
    nba = next_engine.get_next_best_action(student_id)
    if not nba:
        raise HTTPException(status_code=404, detail="No action available.")
    return nba

@router.post("/action/complete/{action_id}")
def mark_action_completed(action_id: int, db: Session = Depends(get_db)):
    action = db.query(RoadmapAction).filter(RoadmapAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Roadmap action not found.")

    action.is_completed = True
    action.completed_at = datetime.datetime.utcnow()
    db.commit()

    EventCollector.log_event(
        db=db,
        student_id=action.roadmap.student_id,
        session_id="roadmap",
        event_type="ROADMAP_ITEM_COMPLETED",
        concept_id=action.concept_id,
        metadata={"action_type": action.action_type}
    )
    db.commit()

    return {"status": "SUCCESS", "action_id": action_id}

@router.get("/weaknesses/{student_id}", response_model=List[WeaknessDetail])
def get_student_weaknesses(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    exam_id = student.target_exam if student else "JEE"

    detector = WeaknessDetector(db, exam_id=exam_id)
    return detector.detect_weaknesses(student_id)

@router.get("/priorities/{student_id}", response_model=List[PriorityItem])
def get_student_priorities(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    exam_id = student.target_exam if student else "JEE"

    engine = PriorityEngine(db, exam_id=exam_id)
    return engine.rank_all_priorities(student_id)

@router.post("/regenerate/{student_id}", response_model=RoadmapResponse)
def regenerate_roadmap(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    generator = RoadmapGenerator(db, exam_id=student.target_exam)
    generator.generate_roadmap(student_id, trigger_event="USER_REGENERATE_REQUEST")

    return get_active_roadmap(student_id, db)
