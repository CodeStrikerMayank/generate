from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from backend.app.database.connection import get_db
from backend.app.models.schema import AssessmentAttempt, Assessment
from backend.app.schemas.pydantic_models import (
    AssessmentStartRequest, AssessmentSessionResponse,
    AssessmentSubmitRequest, AssessmentResultResponse
)
from backend.app.assessment.quiz_engine import QuizEngine
from backend.app.roadmap.generator import RoadmapGenerator

router = APIRouter(prefix="/assessments", tags=["Assessments & Testing"])

@router.post("/start", response_model=AssessmentSessionResponse)
def start_assessment(
    req: AssessmentStartRequest,
    student_id: str,
    db: Session = Depends(get_db)
):
    engine = QuizEngine(db)
    session_data = engine.start_assessment(
        student_id=student_id,
        exam=req.exam,
        assessment_type=req.assessment_type,
        stage=req.stage,
        duration_minutes=req.duration_minutes or 30,
        target_concept_id=req.target_concept_id
    )
    return session_data

@router.post("/start-drill", response_model=AssessmentSessionResponse)
def start_drill_assessment(
    student_id: str,
    subject: str,
    exam: str = "JEE",
    chapter_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    engine = QuizEngine(db)
    session_data = engine.start_drill_assessment(
        student_id=student_id,
        exam=exam,
        subject=subject,
        chapter_id=chapter_id,
        duration_minutes=15
    )
    return session_data

@router.post("/start-full-scan", response_model=AssessmentSessionResponse)
def start_full_scan_assessment(
    student_id: str,
    exam: str = "JEE",
    db: Session = Depends(get_db)
):
    engine = QuizEngine(db)
    session_data = engine.start_full_scan_assessment(
        student_id=student_id,
        exam=exam,
        duration_minutes=40
    )
    return session_data

@router.post("/submit", response_model=AssessmentResultResponse)
def submit_assessment(
    req: AssessmentSubmitRequest,
    db: Session = Depends(get_db)
):
    engine = QuizEngine(db)
    responses_list = [r.model_dump() for r in req.responses]
    result = engine.submit_assessment(
        attempt_id=req.attempt_id,
        responses=responses_list
    )

    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.attempt_id == req.attempt_id).first()
    # Regenerate dynamic roadmap immediately after assessment
    generator = RoadmapGenerator(db, exam_id=attempt.assessment.exam)
    new_roadmap = generator.generate_roadmap(
        student_id=attempt.student_id,
        trigger_event="ASSESSMENT_COMPLETED"
    )

    result["new_roadmap_summary"] = {
        "roadmap_id": new_roadmap.roadmap_id,
        "version": new_roadmap.version,
        "actions_count": len(new_roadmap.actions)
    }

    return result

@router.get("/history/{student_id}")
def get_assessment_history(student_id: str, db: Session = Depends(get_db)):
    attempts = (
        db.query(AssessmentAttempt)
        .filter(AssessmentAttempt.student_id == student_id)
        .order_by(AssessmentAttempt.started_at.desc())
        .all()
    )

    history = []
    for a in attempts:
        asmt = a.assessment
        history.append({
            "attempt_id": a.attempt_id,
            "title": asmt.title if asmt else "Diagnostic Quiz",
            "exam": asmt.exam if asmt else "JEE",
            "score_percentage": a.score_percentage,
            "correct_count": a.correct_count,
            "total_questions": a.total_questions,
            "time_taken_seconds": a.time_taken_seconds,
            "status": a.status,
            "started_at": a.started_at,
            "submitted_at": a.submitted_at
        })

    return history
