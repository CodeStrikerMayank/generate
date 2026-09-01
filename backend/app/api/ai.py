from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from backend.app.database.connection import get_db
from backend.app.models.schema import Student, StudentConceptMastery, Concept, Question
from backend.app.schemas.pydantic_models import AIChatRequest, AIChatResponse, AIQuestionGenRequest
from backend.app.ai.local_llm import LocalLLMClient
from backend.app.ai.explanation import ExplanationGenerator
from backend.app.ai.question_generator import AIQuestionGenerator

router = APIRouter(prefix="/ai", tags=["Offline AI Assistant & Tools"])

@router.post("/chat/{student_id}", response_model=AIChatResponse)
async def chat_with_assistant(
    student_id: str,
    req: AIChatRequest,
    db: Session = Depends(get_db)
):
    llm = LocalLLMClient()

    context_str = ""
    if req.include_student_state:
        student = db.query(Student).filter(Student.student_id == student_id).first()
        if student:
            masteries = db.query(StudentConceptMastery).filter(StudentConceptMastery.student_id == student_id).all()
            avg_m = (sum(m.mastery for m in masteries) / max(len(masteries), 1)) if masteries else 0.0
            context_str = f"Student Exam: {student.target_exam}, Overall Estimated Mastery: {int(avg_m * 100)}%.\n"

    system_prompt = (
        "You are an offline pedagogical AI study assistant for JEE, NEET, and UPSC exams. "
        "Provide direct, conceptually rigorous explanations, memory anchors, and step-by-step guidance. "
        "Never invent fake exam rules."
    )

    full_prompt = f"{context_str}Student Question: {req.prompt}"
    res = await llm.generate_text(full_prompt, system_prompt=system_prompt)

    return AIChatResponse(response=res["text"], source=res["source"])

@router.post("/generate-question")
async def generate_practice_question(
    req: AIQuestionGenRequest,
    db: Session = Depends(get_db)
):
    concept = db.query(Concept).filter(Concept.concept_id == req.concept_id).first()
    concept_name = concept.name if concept else req.concept_id

    gen = AIQuestionGenerator()
    q_data = await gen.generate_candidate_question(
        exam=req.exam,
        subject=req.subject,
        chapter=req.chapter,
        concept_id=req.concept_id,
        concept_name=concept_name,
        target_difficulty=req.difficulty
    )
    return q_data
