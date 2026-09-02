"""
Supporting Features API Router
Platform Upgrade v3.0:
1. Spaced Repetition Review Queue (Ebbinghaus Decay)
2. Error-Pattern Trend Analytics
3. Printable/Exportable Report Card
"""
import datetime
from fastapi import APIRouter, Depends, HTTPException, Header

from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from backend.app.database.connection import get_db
from backend.app.models.schema import (
    Student, StudentConceptMastery, StudentErrorLog,
    AssessmentAttempt, Concept, Roadmap, RoadmapAction
)

router = APIRouter(prefix="/supporting", tags=["Supporting Features"])

admin_router = APIRouter(prefix="/admin", tags=["Admin"])

ADMIN_KEY = "1234admin"

def _verify_admin(request_key: str):
    if request_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Admin access denied")

@admin_router.post("/reset-db")
def reset_database(db: Session = Depends(get_db), x_admin_key: Optional[str] = Header(None)):
    """Hard reset: wipe all student data, preserve curriculum and question bank."""
    import sqlalchemy

    _verify_admin(x_admin_key or "")

    # Delete in FK-safe order (leaf tables first, then parents)
    # Preserves: exams, subjects, chapters, topics, concepts, prerequisites, questions, assessments
    tables_to_clear = [
        "student_attempt_items",
        "assessment_attempts",
        "student_error_logs",
        "student_concept_mastery",
        "roadmap_actions",
        "roadmaps",
        "learning_events",
        "students",
    ]
    try:
        for table in tables_to_clear:
            db.execute(sqlalchemy.text(f"DELETE FROM {table}"))
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")

    return {"status": "RESET_COMPLETE", "message": "All student data wiped. Question bank and curriculum preserved."}




@admin_router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db), x_admin_key: Optional[str] = Header(None)):
    """Admin dashboard stats."""
    from backend.app.models.schema import AssessmentAttempt, Question
    _verify_admin(x_admin_key or "")

    students_all = db.query(Student).order_by(Student.created_at.desc()).limit(20).all()
    total_attempts = db.query(AssessmentAttempt).count()
    total_questions = db.query(Question).count() if hasattr(db.query(Student), 'count') else 0
    try:
        from backend.app.models.schema import Question as Q
        total_questions = db.query(Q).count()
    except Exception:
        total_questions = 0

    students_data = []
    for s in students_all:
        attempts = db.query(AssessmentAttempt).filter(AssessmentAttempt.student_id == s.student_id).count()
        students_data.append({
            "student_id": s.student_id,
            "name": s.name,
            "target_exam": s.target_exam,
            "attempts": attempts,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })

    return {
        "total_students": db.query(Student).count(),
        "total_attempts": total_attempts,
        "total_questions": total_questions,
        "students": students_data
    }




@router.get("/review-queue/{student_id}")
def get_review_queue(student_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns concepts where memory retention has dropped below 60%
    or forgetting risk is elevated, ordered by review urgency.
    """
    now = datetime.datetime.utcnow()
    masteries = db.query(StudentConceptMastery).filter(
        StudentConceptMastery.student_id == student_id
    ).all()

    due_for_review = []
    for m in masteries:
        concept = db.query(Concept).filter(Concept.concept_id == m.concept_id).first()
        c_name = concept.name if concept else m.concept_id
        subject = concept.topic.chapter.subject.name if (concept and concept.topic and concept.topic.chapter and concept.topic.chapter.subject) else "General"

        days_ago = 0.0
        if m.last_practiced_at:
            delta = now - m.last_practiced_at
            days_ago = round(delta.total_seconds() / 86400.0, 1)

        retention = m.retention_score if m.retention_score is not None else 1.0
        # If retention < 0.65 or forgetting_risk > 0.35, queue for review
        if retention < 0.65 or m.forgetting_risk > 0.35 or days_ago >= 3.0:
            due_for_review.append({
                "concept_id": m.concept_id,
                "concept_name": c_name,
                "subject": subject,
                "current_mastery": round(m.mastery * 100, 1),
                "retention_score": round(retention * 100, 1),
                "forgetting_risk": round(m.forgetting_risk * 100, 1),
                "days_since_practice": days_ago,
                "urgency": "HIGH" if retention < 0.50 else "MODERATE"
            })

    # Sort by lowest retention first
    due_for_review.sort(key=lambda x: x["retention_score"])

    return {
        "student_id": student_id,
        "total_due": len(due_for_review),
        "queue": due_for_review
    }


@router.get("/error-trends/{student_id}")
def get_error_trends(student_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Aggregates student error patterns (e.g. calculation slips vs conceptual gaps)
    and subject distribution to highlight cognitive tendencies.
    """
    error_logs = db.query(StudentErrorLog).filter(
        StudentErrorLog.student_id == student_id
    ).order_by(StudentErrorLog.timestamp.desc()).all()

    by_type: Dict[str, int] = {}
    by_subject: Dict[str, int] = {}
    recent_details: List[Dict[str, Any]] = []

    for log in error_logs:
        etype = log.error_type or "CONCEPTUAL_GAP"
        by_type[etype] = by_type.get(etype, 0) + 1

        c = db.query(Concept).filter(Concept.concept_id == log.concept_id).first()
        sub = c.topic.chapter.subject.name if (c and c.topic and c.topic.chapter and c.topic.chapter.subject) else "General"
        by_subject[sub] = by_subject.get(sub, 0) + 1

        if len(recent_details) < 10:
            recent_details.append({
                "concept_id": log.concept_id,
                "concept_name": c.name if c else log.concept_id,
                "subject": sub,
                "error_type": etype,
                "details": log.details,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None
            })

    return {
        "student_id": student_id,
        "total_errors": len(error_logs),
        "by_error_type": by_type,
        "by_subject": by_subject,
        "recent_errors": recent_details
    }


@router.get("/report-card/{student_id}")
def get_report_card(student_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns complete student audit data formatted for exportable PDF / Printable View:
    - Overall stats
    - Subject breakdown
    - Strengths & Gaps
    - Dynamic Roadmap Milestones
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    masteries = db.query(StudentConceptMastery).filter(
        StudentConceptMastery.student_id == student_id
    ).all()

    total_m = sum(m.mastery for m in masteries)
    avg_mastery = round((total_m / max(len(masteries), 1)) * 100, 1) if masteries else 0.0
    avg_theta = round(sum(m.irt_ability for m in masteries) / max(len(masteries), 1), 2) if masteries else 0.0

    # Subject breakdown
    sub_map = {}
    strong_concepts = []
    weak_concepts = []

    for m in masteries:
        c = db.query(Concept).filter(Concept.concept_id == m.concept_id).first()
        sub = c.topic.chapter.subject.name if (c and c.topic and c.topic.chapter and c.topic.chapter.subject) else "General"
        if sub not in sub_map:
            sub_map[sub] = {"total_mastery": 0.0, "count": 0}
        sub_map[sub]["total_mastery"] += m.mastery
        sub_map[sub]["count"] += 1

        c_info = {
            "concept_id": m.concept_id,
            "concept_name": c.name if c else m.concept_id,
            "subject": sub,
            "mastery_pct": round(m.mastery * 100, 1)
        }
        if m.mastery >= 0.70:
            strong_concepts.append(c_info)
        elif m.mastery < 0.40:
            weak_concepts.append(c_info)

    subject_breakdown = []
    for sub, d in sub_map.items():
        avg = round((d["total_mastery"] / max(d["count"], 1)) * 100, 1)
        subject_breakdown.append({
            "subject": sub,
            "concepts_evaluated": d["count"],
            "average_mastery_pct": avg,
            "status": "STRONG" if avg >= 70 else ("NEEDS_WORK" if avg < 50 else "MODERATE")
        })

    # Latest Roadmap Actions
    rm = db.query(Roadmap).filter(Roadmap.student_id == student_id).order_by(Roadmap.created_at.desc()).first()
    actions_summary = []
    if rm:
        acts = db.query(RoadmapAction).filter(RoadmapAction.roadmap_id == rm.roadmap_id).order_by(RoadmapAction.sequence_order).limit(5).all()
        for a in acts:
            actions_summary.append({
                "step": a.sequence_order,
                "title": a.concept_id,
                "type": a.action_type,
                "estimated_minutes": a.estimated_minutes
            })

    return {
        "student": {
            "id": student.student_id,
            "name": student.name,
            "exam": student.target_exam,
            "created_at": student.created_at.strftime("%B %d, %Y") if student.created_at else "Recently"
        },
        "overall_performance": {
            "syllabus_mastery_pct": avg_mastery,
            "irt_ability_theta": avg_theta,
            "concepts_tracked": len(masteries),
            "strong_concepts_count": len(strong_concepts),
            "weak_gaps_count": len(weak_concepts)
        },
        "subject_breakdown": subject_breakdown,
        "weak_concepts": weak_concepts[:6],
        "strong_concepts": strong_concepts[:6],
        "upcoming_milestones": actions_summary,
        "generated_at": datetime.datetime.utcnow().strftime("%B %d, %Y - %H:%M UTC")
    }
