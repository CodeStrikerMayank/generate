import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.app.database.connection import get_db
from backend.app.models.schema import Question, UPSCWrittenSubmission
from backend.app.schemas.pydantic_models import (
    UPSCWrittenSubmissionRequest, UPSCWrittenEvaluationResponse
)
from backend.app.ai.upsc_evaluator import UPSCAnswerEvaluator
from backend.app.events.collector import EventCollector

router = APIRouter(prefix="/upsc", tags=["UPSC Written Studio"])

@router.get("/questions")
def get_upsc_mains_questions(db: Session = Depends(get_db)):
    questions = (
        db.query(Question)
        .filter(Question.exam == "UPSC", Question.question_type == "descriptive")
        .all()
    )
    return [
        {
            "question_id": q.question_id,
            "paper": q.paper,
            "subject": q.subject,
            "chapter": q.chapter,
            "topic": q.topic,
            "concept_id": q.concept_id,
            "skill": q.skill,
            "difficulty": q.difficulty,
            "estimated_time": q.estimated_time,
            "content": q.content,
            "rubrics": q.rubrics
        }
        for q in questions
    ]

@router.post("/submit/{student_id}", response_model=UPSCWrittenEvaluationResponse)
def submit_upsc_answer(
    student_id: str,
    req: UPSCWrittenSubmissionRequest,
    db: Session = Depends(get_db)
):
    question = db.query(Question).filter(Question.question_id == req.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")

    evaluator = UPSCAnswerEvaluator()
    eval_result = evaluator.evaluate_written_response(
        question_content=question.content,
        student_answer=req.answer_text,
        model_answer_outline=question.correct_answer,
        rubric_spec=question.rubrics
    )

    submission_id = f"sub_{uuid.uuid4().hex[:12]}"
    submission = UPSCWrittenSubmission(
        submission_id=submission_id,
        student_id=student_id,
        question_id=req.question_id,
        student_answer_text=req.answer_text,
        word_count=eval_result["word_count"],
        time_taken_seconds=req.time_taken_seconds,
        rubric_scores=eval_result["rubric_scores"],
        total_score=eval_result["total_score"],
        max_score=eval_result["max_score"],
        ai_feedback_summary=eval_result["ai_feedback_summary"],
        evaluator_type=eval_result["evaluator_type"]
    )
    db.add(submission)
    db.flush()

    EventCollector.log_event(
        db=db,
        student_id=student_id,
        session_id="upsc_studio",
        event_type="UPSC_ESSAY_SUBMITTED",
        resource_id=req.question_id,
        metadata={"submission_id": submission_id, "score": eval_result["total_score"]}
    )
    db.commit()

    return UPSCWrittenEvaluationResponse(
        submission_id=submission_id,
        question_id=req.question_id,
        word_count=eval_result["word_count"],
        time_taken_seconds=req.time_taken_seconds,
        rubric_scores=eval_result["rubric_scores"],
        total_score=eval_result["total_score"],
        max_score=eval_result["max_score"],
        ai_feedback_summary=eval_result["ai_feedback_summary"],
        evaluator_type=eval_result["evaluator_type"]
    )
