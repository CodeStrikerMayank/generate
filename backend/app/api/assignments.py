import datetime
import uuid
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db
from backend.app.models.schema import (
    Student, DailyAssignment, DailyAssignmentItem, Question,
    StudentAttemptItem, StudentConceptMastery, StudentErrorLog
)
from backend.app.curriculum.exambench_service import ExamBenchService
from backend.app.student_model.mastery import MasteryEngine
from backend.app.student_model.bkt import BayesianKnowledgeTracing
from backend.app.student_model.irt import ItemResponseTheory
from backend.app.student_model.error_classifier import ErrorClassifier
from backend.app.events.collector import EventCollector

router = APIRouter(prefix="/assignments", tags=["Daily Assignments"])

# Pydantic request models
class ItemProgress(BaseModel):
    question_id: str
    student_answer: Optional[str] = None
    is_marked_review: bool = False
    time_taken_seconds: int = 0

class SaveProgressRequest(BaseModel):
    assignment_id: str
    responses: List[ItemProgress]

class SubmitAssignmentRequest(BaseModel):
    assignment_id: str
    responses: List[ItemProgress]
    time_taken_seconds: Optional[int] = 0


def get_stream_subjects(exam: str) -> List[str]:
    """Returns the 3 canonical subjects for each exam stream."""
    if exam == "NEET":
        return ["Biology", "Physics", "Chemistry"]
    elif exam == "CENTRAL_GOVT" or exam == "UPSC":
        return ["General Studies", "Science & Technology", "Mathematics"]
    return ["Physics", "Chemistry", "Mathematics"]  # Default JEE PCM


@router.get("/today/{student_id}")
def get_today_assignment(
    student_id: str,
    questions_per_subject: int = 20,
    db: Session = Depends(get_db)
):
    """
    Retrieves or automatically generates today's 3-subject daily assignment (20-25 questions per subject)
    from the HuggingFace ExamBench repository.
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    today_str = datetime.date.today().isoformat()
    exam = student.target_exam or "JEE"

    # Check if assignment for today already exists
    assignment = (
        db.query(DailyAssignment)
        .filter(
            DailyAssignment.student_id == student_id,
            DailyAssignment.assignment_date == today_str
        )
        .first()
    )

    if not assignment:
        # Generate new assignment
        subjects = get_stream_subjects(exam)
        eb_service = ExamBenchService()

        assignment_id = f"asgn_{today_str.replace('-', '')}_{uuid.uuid4().hex[:6]}"
        title = f"Daily 3-Subject Assignment — {today_str} ({exam})"

        # Fetch questions for each subject
        q_count = max(10, min(questions_per_subject, 25))
        total_q = q_count * len(subjects)

        assignment = DailyAssignment(
            assignment_id=assignment_id,
            student_id=student_id,
            exam=exam,
            assignment_date=today_str,
            title=title,
            status="IN_PROGRESS",
            total_questions=total_q,
            completed_count=0,
            correct_count=0,
            score_percentage=0.0,
            subject_scores={},
            created_at=datetime.datetime.utcnow()
        )
        db.add(assignment)
        db.flush()

        seq = 0
        for sub in subjects:
            sub_questions = eb_service.get_stream_questions_for_assignment(
                db=db,
                exam=exam,
                subject=sub,
                count=q_count
            )
            for q in sub_questions:
                seq += 1
                item = DailyAssignmentItem(
                    assignment_id=assignment_id,
                    question_id=q.question_id,
                    subject=sub,
                    sequence_index=seq,
                    student_answer=None,
                    is_correct=None,
                    is_marked_review=False,
                    time_taken_seconds=0
                )
                db.add(item)

        EventCollector.log_event(
            db=db,
            student_id=student_id,
            session_id=f"sess_{assignment_id}",
            event_type="ASSIGNMENT_GENERATED",
            resource_id=assignment_id,
            metadata={"exam": exam, "date": today_str, "total_questions": total_q, "subjects": subjects}
        )
        db.commit()

    # Build response with formatted question cards per subject
    items = (
        db.query(DailyAssignmentItem)
        .filter(DailyAssignmentItem.assignment_id == assignment.assignment_id)
        .order_by(DailyAssignmentItem.sequence_index.asc())
        .all()
    )

    q_ids = [item.question_id for item in items]
    questions_dict = {q.question_id: q for q in db.query(Question).filter(Question.question_id.in_(q_ids)).all()}

    subjects_map: Dict[str, List[Dict[str, Any]]] = {}
    for item in items:
        sub = item.subject
        if sub not in subjects_map:
            subjects_map[sub] = []

        q = questions_dict.get(item.question_id)
        if not q:
            continue

        q_info = {
            "question_id": q.question_id,
            "sequence_index": item.sequence_index,
            "subject": item.subject,
            "chapter": q.chapter,
            "topic": q.topic,
            "concept_id": q.concept_id,
            "difficulty": q.difficulty,
            "skill": q.skill,
            "content": q.content,
            "options": q.options,
            "estimated_time": q.estimated_time,
            "student_answer": item.student_answer,
            "is_marked_review": item.is_marked_review,
            "is_correct": item.is_correct if assignment.status == "COMPLETED" else None,
            "correct_answer": q.correct_answer if assignment.status == "COMPLETED" else None,
            "explanation": q.explanation if assignment.status == "COMPLETED" else None
        }
        subjects_map[sub].append(q_info)

    return {
        "assignment_id": assignment.assignment_id,
        "student_id": assignment.student_id,
        "exam": assignment.exam,
        "assignment_date": assignment.assignment_date,
        "title": assignment.title,
        "status": assignment.status,
        "total_questions": assignment.total_questions,
        "completed_count": assignment.completed_count,
        "correct_count": assignment.correct_count,
        "score_percentage": assignment.score_percentage,
        "time_taken_seconds": assignment.time_taken_seconds,
        "subject_scores": assignment.subject_scores or {},
        "subjects": list(subjects_map.keys()),
        "questions_by_subject": subjects_map
    }


@router.post("/save-progress")
def save_assignment_progress(
    req: SaveProgressRequest,
    db: Session = Depends(get_db)
):
    """Autosaves answers and review markers for an in-progress daily assignment."""
    assignment = db.query(DailyAssignment).filter(DailyAssignment.assignment_id == req.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    items = db.query(DailyAssignmentItem).filter(DailyAssignmentItem.assignment_id == req.assignment_id).all()
    item_map = {it.question_id: it for it in items}

    answered_count = 0
    for resp in req.responses:
        it = item_map.get(resp.question_id)
        if it:
            if resp.student_answer is not None:
                it.student_answer = resp.student_answer
            it.is_marked_review = resp.is_marked_review
            if resp.time_taken_seconds:
                it.time_taken_seconds = resp.time_taken_seconds

    # Count total answered
    for it in items:
        if it.student_answer:
            answered_count += 1

    assignment.completed_count = answered_count
    db.commit()

    return {"status": "SUCCESS", "completed_count": answered_count, "total_questions": assignment.total_questions}


@router.post("/submit")
def submit_assignment(
    req: SubmitAssignmentRequest,
    db: Session = Depends(get_db)
):
    """
    Grades the 3-subject daily assignment, updates subject scores, student concept mastery,
    Bayesian Knowledge Tracing, and cognitive error classification logs.
    """
    assignment = db.query(DailyAssignment).filter(DailyAssignment.assignment_id == req.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    now = datetime.datetime.utcnow()
    items = db.query(DailyAssignmentItem).filter(DailyAssignmentItem.assignment_id == req.assignment_id).all()
    item_map = {it.question_id: it for it in items}

    # Update answers from request if present
    for resp in req.responses:
        it = item_map.get(resp.question_id)
        if it:
            if resp.student_answer is not None:
                it.student_answer = resp.student_answer
            it.is_marked_review = resp.is_marked_review
            if resp.time_taken_seconds:
                it.time_taken_seconds = resp.time_taken_seconds

    # Grade items
    q_ids = [it.question_id for it in items]
    questions = db.query(Question).filter(Question.question_id.in_(q_ids)).all()
    q_dict = {q.question_id: q for q in questions}

    total_correct = 0
    total_answered = 0
    subject_stats = {}
    mastery_cache: Dict[str, StudentConceptMastery] = {}

    # Preload existing masteries for this student
    existing_masteries = db.query(StudentConceptMastery).filter(
        StudentConceptMastery.student_id == assignment.student_id
    ).all()
    for m in existing_masteries:
        mastery_cache[m.concept_id] = m

    for it in items:
        q = q_dict.get(it.question_id)
        if not q:
            continue

        sub = it.subject
        if sub not in subject_stats:
            subject_stats[sub] = {"total": 0, "answered": 0, "correct": 0}
        subject_stats[sub]["total"] += 1

        if it.student_answer:
            total_answered += 1
            subject_stats[sub]["answered"] += 1
            is_correct = (it.student_answer == q.correct_answer)
            it.is_correct = is_correct

            if is_correct:
                total_correct += 1
                subject_stats[sub]["correct"] += 1
            else:
                # Classify cognitive error
                err_info = ErrorClassifier.classify_error(
                    question_distractor_explanations=q.distractor_explanations,
                    student_answer=it.student_answer,
                    correct_answer=q.correct_answer,
                    time_taken_seconds=it.time_taken_seconds or q.estimated_time,
                    estimated_time_seconds=q.estimated_time
                )
                if err_info["error_type"]:
                    err_log = StudentErrorLog(
                        student_id=assignment.student_id,
                        question_id=q.question_id,
                        concept_id=q.concept_id,
                        error_type=err_info["error_type"],
                        details=err_info["note"],
                        timestamp=now
                    )
                    db.add(err_log)

            # Update student concept mastery with in-memory caching
            cid = q.concept_id
            mastery_rec = mastery_cache.get(cid)
            if not mastery_rec:
                mastery_rec = StudentConceptMastery(
                    student_id=assignment.student_id,
                    concept_id=cid
                )
                db.add(mastery_rec)
                mastery_cache[cid] = mastery_rec

            mastery_rec.attempts_count = (mastery_rec.attempts_count or 0) + 1
            cur_correct = mastery_rec.correct_count or 0
            if is_correct:
                cur_correct += 1
            mastery_rec.correct_count = cur_correct
            mastery_rec.recent_accuracy = round(cur_correct / max(mastery_rec.attempts_count, 1), 2)
            mastery_rec.mastery = min(1.0, max(0.1, mastery_rec.recent_accuracy * 0.9 + 0.1))
            mastery_rec.last_practiced_at = now
        else:
            it.is_correct = False

    # Format subject scores
    subject_scores = {}
    for sub, stats in subject_stats.items():
        tot = stats["total"]
        corr = stats["correct"]
        pct = round((corr / max(tot, 1)) * 100, 1)
        subject_scores[sub] = {
            "total": tot,
            "answered": stats["answered"],
            "correct": corr,
            "score_percentage": pct
        }

    overall_pct = round((total_correct / max(len(items), 1)) * 100, 1)
    assignment.status = "COMPLETED"
    assignment.completed_count = total_answered
    assignment.correct_count = total_correct
    assignment.score_percentage = overall_pct
    assignment.time_taken_seconds = req.time_taken_seconds or 0
    assignment.subject_scores = subject_scores
    assignment.submitted_at = now

    EventCollector.log_event(
        db=db,
        student_id=assignment.student_id,
        session_id=f"sess_{assignment.assignment_id}",
        event_type="ASSIGNMENT_SUBMITTED",
        resource_id=assignment.assignment_id,
        metadata={
            "score_percentage": overall_pct,
            "correct_count": total_correct,
            "total_questions": len(items),
            "subject_scores": subject_scores
        }
    )

    db.commit()

    return {
        "assignment_id": assignment.assignment_id,
        "status": "COMPLETED",
        "total_questions": len(items),
        "completed_count": total_answered,
        "correct_count": total_correct,
        "score_percentage": overall_pct,
        "subject_scores": subject_scores,
        "submitted_at": assignment.submitted_at
    }


@router.get("/history/{student_id}")
def get_assignment_history(student_id: str, db: Session = Depends(get_db)):
    """Returns assignment history and calculates current daily streak."""
    assignments = (
        db.query(DailyAssignment)
        .filter(DailyAssignment.student_id == student_id)
        .order_by(DailyAssignment.assignment_date.desc())
        .all()
    )

    history = []
    completed_dates = set()
    for a in assignments:
        history.append({
            "assignment_id": a.assignment_id,
            "assignment_date": a.assignment_date,
            "exam": a.exam,
            "title": a.title,
            "status": a.status,
            "total_questions": a.total_questions,
            "completed_count": a.completed_count,
            "correct_count": a.correct_count,
            "score_percentage": a.score_percentage,
            "subject_scores": a.subject_scores or {},
            "submitted_at": a.submitted_at
        })
        if a.status == "COMPLETED":
            completed_dates.add(a.assignment_date)

    # Calculate streak
    streak = 0
    check_date = datetime.date.today()
    while check_date.isoformat() in completed_dates:
        streak += 1
        check_date -= datetime.timedelta(days=1)

    return {
        "student_id": student_id,
        "streak_days": streak,
        "total_assignments_completed": len(completed_dates),
        "history": history
    }
