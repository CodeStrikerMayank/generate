import uuid
import re
import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db
from backend.app.models.schema import Student, Question, UPSCWrittenSubmission, Concept
from backend.app.events.collector import EventCollector

router = APIRouter(prefix="/upsc", tags=["UPSC Civil Services Subsystem"])

class WrittenSubmissionInput(BaseModel):
    student_id: str
    question_id: str
    answer_text: str
    time_taken_seconds: int = 420


OFFICIAL_MAINS_PROMPTS = [
    {
        "question_id": "UPSC_MAINS_GS2_01",
        "paper": "GS Paper II (Polity & Governance)",
        "subject": "Indian Polity & Governance",
        "marks": 15,
        "word_limit": 250,
        "question_text": "The Basic Structure doctrine has acted as a bulwark against executive hegemony, but critics argue it leads to judicial overreach. Critically examine in light of recent constitutional jurisprudence.",
        "key_dimensions": ["Kesavananda Bharati case", "Article 368 vs Article 13", "NJAC judgment", "Separation of powers", "Constitutional morality"],
        "recommended_structure": "Intro: Origin & definition of Basic Structure -> Arguments in favor of judicial review -> Critiques regarding democratic accountability -> Balanced conclusion."
    },
    {
        "question_id": "UPSC_MAINS_GS2_02",
        "paper": "GS Paper II (Governance)",
        "subject": "Indian Polity & Governance",
        "marks": 10,
        "word_limit": 150,
        "question_text": "How far has the Goods and Services Tax (GST) Council succeeded in fostering 'cooperative federalism' between the Union and States? Discuss.",
        "key_dimensions": ["Article 279A", "Consensus vs majority voting", "Fiscal autonomy of states", "Compensation cess disputes"],
        "recommended_structure": "Intro: Mandate of GST Council -> Successes in collaborative taxation -> Friction points -> Way forward."
    },
    {
        "question_id": "UPSC_MAINS_GS3_01",
        "paper": "GS Paper III (Economy & Environment)",
        "subject": "Economy, Environment & Technology",
        "marks": 15,
        "word_limit": 250,
        "question_text": "Examine the challenges and opportunities associated with India's target of achieving Net-Zero carbon emissions by 2070 while sustaining rapid economic growth.",
        "key_dimensions": ["Panchamrit targets", "Renewable energy transition", "Coal phase-down vs baseload security", "Climate finance and green hydrogen", "Just transition"],
        "recommended_structure": "Intro: COP26 Net-Zero pledge -> Structural economic headwinds -> Technology & policy pathways -> Conclusion."
    },
    {
        "question_id": "UPSC_MAINS_GS4_01",
        "paper": "GS Paper IV (Ethics)",
        "subject": "Ethics, Integrity & Aptitude",
        "marks": 10,
        "word_limit": 150,
        "question_text": "A public servant's personal ethics must harmonize with administrative neutrality. Discuss the ethical dilemmas faced when personal conscience conflicts with statutory duty.",
        "key_dimensions": ["Deontological vs teleological principles", "Civil service conduct rules", "Whistleblowing vs institutional discipline", "Nolan Committee principles"],
        "recommended_structure": "Intro: Define administrative neutrality vs conscience -> Core dilemmas -> Guiding frameworks -> Conclusion."
    }
]


@router.get("/mains-prompts")
def get_mains_prompts():
    """Returns curated authentic UPSC Civil Services Mains analytical questions."""
    return OFFICIAL_MAINS_PROMPTS


@router.get("/prelims-quiz")
def get_prelims_quiz(db: Session = Depends(get_db)):
    """Returns multiple-choice Prelims questions for UPSC Civil Services."""
    questions = db.query(Question).filter(
        Question.exam.in_(["UPSC", "CENTRAL_GOVT"])
    ).limit(15).all()

    if len(questions) < 5:
        # Fallback to general studies questions
        questions = db.query(Question).filter(
            Question.subject.in_(["General Studies", "Chemistry", "Physics"])
        ).limit(15).all()

    results = []
    for q in questions:
        results.append({
            "question_id": q.question_id,
            "subject": q.subject,
            "chapter": q.chapter,
            "topic": q.topic,
            "content": q.content,
            "options": q.options,
            "correct_answer": q.correct_answer,
            "explanation": q.explanation,
            "difficulty": q.difficulty,
            "estimated_time": q.estimated_time or 60,
            "image_url": getattr(q, "image_url", None)
        })
    return results


@router.post("/evaluate-written")
def evaluate_written_answer(
    req: WrittenSubmissionInput,
    db: Session = Depends(get_db)
):
    """
    Evaluates a UPSC Mains written descriptive response using a multi-dimensional rubric:
    1. Understanding & Relevance (0 - 3.0)
    2. Structural Organization (0 - 3.0)
    3. Content Depth & Facts (0 - 3.0)
    4. Constitutional / Policy Context (0 - 3.0)
    5. Critical Balance & Presentation (0 - 3.0)
    Total: /15.0 marks
    """
    student = db.query(Student).filter(Student.student_id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Match prompt
    prompt = next((p for p in OFFICIAL_MAINS_PROMPTS if p["question_id"] == req.question_id), None)
    max_score = prompt["marks"] if prompt else 15.0
    word_limit = prompt["word_limit"] if prompt else 250

    words = req.answer_text.strip().split()
    word_count = len(words)

    # Multi-dimensional rubric evaluation
    rubrics = {}
    feedback_points = []

    # 1. Understanding & Word Count Adherence (0 - 3.0)
    if word_count < 50:
        rubrics["understanding"] = 1.0
        feedback_points.append("Response is significantly under the minimum threshold; elaborate on core aspects.")
    elif abs(word_count - word_limit) <= (word_limit * 0.25):
        rubrics["understanding"] = 2.7
        feedback_points.append(f"Excellent conciseness: {word_count} words closely matches target limit ({word_limit}).")
    else:
        rubrics["understanding"] = 2.1
        feedback_points.append(f"Word length ({word_count} words) deviates somewhat from optimal budget.")

    # 2. Structural Organization (0 - 3.0)
    # Check for paragraphs, headings, bullet points
    has_structure = "\n" in req.answer_text or any(b in req.answer_text for b in ["- ", "• ", "1.", "First", "Secondly", "In conclusion", "Way forward"])
    if has_structure and len(req.answer_text.split("\n\n")) >= 3:
        rubrics["structure"] = 2.8
        feedback_points.append("Well-organized response with distinct introduction, core body paragraphs, and forward-looking conclusion.")
    elif has_structure:
        rubrics["structure"] = 2.2
        feedback_points.append("Good paragraph separation, though transitions could be crisper.")
    else:
        rubrics["structure"] = 1.4
        feedback_points.append("Monolithic block text detected: break into structured headings and bulleted arguments.")

    # 3. Content Depth & Key Dimension Match (0 - 3.0)
    text_lower = req.answer_text.lower()
    matched_dims = 0
    if prompt:
        for dim in prompt["key_dimensions"]:
            keywords = [w.lower() for w in dim.split() if len(w) > 3]
            if any(k in text_lower for k in keywords):
                matched_dims += 1
        dim_ratio = matched_dims / max(len(prompt["key_dimensions"]), 1)
        rubrics["content_depth"] = round(1.2 + dim_ratio * 1.6, 2)
        feedback_points.append(f"Addressed {matched_dims}/{len(prompt['key_dimensions'])} core syllabus dimensions.")
    else:
        rubrics["content_depth"] = 2.2

    # 4. Constitutional & Policy Context (0 - 3.0)
    has_legal_terms = any(t in text_lower for t in ["article", "constitution", "supreme court", "act", "doctrine", "policy", "commission", "statute", "judgment"])
    if has_legal_terms:
        rubrics["policy_context"] = 2.6
        feedback_points.append("Substantiated with constitutional/statutory provisions and institutional references.")
    else:
        rubrics["policy_context"] = 1.5
        feedback_points.append("Lacks specific article citations or policy framework mentions.")

    # 5. Critical Balance & Presentation (0 - 3.0)
    has_counter = any(w in text_lower for w in ["however", "critics", "on the other hand", "despite", "balance", "challenge", "nonetheless"])
    if has_counter:
        rubrics["critical_balance"] = 2.7
        feedback_points.append("Demonstrates balanced critical appraisal presenting both opportunities and operational constraints.")
    else:
        rubrics["critical_balance"] = 1.8
        feedback_points.append("Argument appears somewhat one-sided; acknowledge counter-arguments for higher civil services scoring.")

    total_score = round(sum(rubrics.values()), 1)
    if max_score == 10:
        total_score = round((total_score / 15.0) * 10.0, 1)

    sub_id = f"upsc_sub_{uuid.uuid4().hex[:8]}"
    summary_text = " • ".join(feedback_points)

    submission = UPSCWrittenSubmission(
        submission_id=sub_id,
        student_id=req.student_id,
        question_id=req.question_id,
        student_answer_text=req.answer_text,
        word_count=word_count,
        time_taken_seconds=req.time_taken_seconds,
        rubric_scores=rubrics,
        total_score=total_score,
        max_score=max_score,
        ai_feedback_summary=summary_text,
        evaluator_type="CIVIL_SERVICES_RUBRIC_AI",
        created_at=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    )
    db.add(submission)

    EventCollector.log_event(
        db=db,
        student_id=req.student_id,
        session_id=f"sess_{sub_id}",
        event_type="UPSC_ESSAY_SUBMITTED",
        resource_id=req.question_id,
        metadata={"total_score": total_score, "max_score": max_score, "word_count": word_count}
    )
    db.commit()

    return {
        "submission_id": sub_id,
        "question_id": req.question_id,
        "word_count": word_count,
        "time_taken_seconds": req.time_taken_seconds,
        "rubric_scores": rubrics,
        "total_score": total_score,
        "max_score": max_score,
        "ai_feedback_summary": summary_text,
        "evaluator_type": "CIVIL_SERVICES_RUBRIC_AI"
    }


@router.get("/history/{student_id}")
def get_upsc_history(student_id: str, db: Session = Depends(get_db)):
    """Returns past UPSC written submissions and evaluations."""
    subs = (
        db.query(UPSCWrittenSubmission)
        .filter(UPSCWrittenSubmission.student_id == student_id)
        .order_by(UPSCWrittenSubmission.created_at.desc())
        .all()
    )

    history = []
    for s in subs:
        prompt = next((p for p in OFFICIAL_MAINS_PROMPTS if p["question_id"] == s.question_id), None)
        history.append({
            "submission_id": s.submission_id,
            "question_id": s.question_id,
            "question_title": prompt["question_text"][:80] + "..." if prompt else s.question_id,
            "paper": prompt["paper"] if prompt else "UPSC Mains",
            "word_count": s.word_count,
            "total_score": s.total_score,
            "max_score": s.max_score,
            "ai_feedback_summary": s.ai_feedback_summary,
            "created_at": s.created_at.strftime("%Y-%m-%d %H:%M") if s.created_at else ""
        })
    return history
