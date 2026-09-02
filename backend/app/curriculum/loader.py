import json
import os
from sqlalchemy.orm import Session
from backend.app.models.schema import (
    Exam, Subject, Chapter, Topic, Concept, Prerequisite, Question
)

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
if not os.path.exists(os.path.join(DATA_DIR, "curriculum")):
    DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")

def seed_curriculum_and_questions(db: Session):
    """
    Parses JSON curriculum and question files from data/ and seeds the database idempotently.
    """
    curriculum_dir = os.path.join(DATA_DIR, "curriculum")
    questions_dir = os.path.join(DATA_DIR, "questions")

    if not os.path.exists(curriculum_dir):
        return

    # Seed Curricula (JEE, NEET, UPSC)
    for filename in os.listdir(curriculum_dir):
        if not filename.endswith(".json"):
            continue
        filepath = os.path.join(curriculum_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        exam_id = data["exam_id"]
        exam = db.query(Exam).filter(Exam.exam_id == exam_id).first()
        if not exam:
            exam = Exam(
                exam_id=exam_id,
                name=data["name"],
                tracks=data.get("tracks", [])
            )
            db.add(exam)
            db.flush()

        for sub_data in data.get("subjects", []):
            subject_id = sub_data["subject_id"]
            subject = db.query(Subject).filter(Subject.subject_id == subject_id).first()
            if not subject:
                subject = Subject(
                    subject_id=subject_id,
                    exam_id=exam_id,
                    name=sub_data["name"]
                )
                db.add(subject)
                db.flush()

            for chap_data in sub_data.get("chapters", []):
                chapter_id = chap_data["chapter_id"]
                chapter = db.query(Chapter).filter(Chapter.chapter_id == chapter_id).first()
                if not chapter:
                    chapter = Chapter(
                        chapter_id=chapter_id,
                        subject_id=subject_id,
                        name=chap_data["name"]
                    )
                    db.add(chapter)
                    db.flush()

                for top_data in chap_data.get("topics", []):
                    topic_id = top_data["topic_id"]
                    topic = db.query(Topic).filter(Topic.topic_id == topic_id).first()
                    if not topic:
                        topic = Topic(
                            topic_id=topic_id,
                            chapter_id=chapter_id,
                            name=top_data["name"]
                        )
                        db.add(topic)
                        db.flush()

                    for con_data in top_data.get("concepts", []):
                        concept_id = con_data["concept_id"]
                        concept = db.query(Concept).filter(Concept.concept_id == concept_id).first()
                        if not concept:
                            concept = Concept(
                                concept_id=concept_id,
                                topic_id=topic_id,
                                name=con_data["name"],
                                estimated_minutes=con_data.get("estimated_minutes", 45),
                                exam_relevance=con_data.get("exam_relevance", 0.85),
                                difficulty_weight=con_data.get("difficulty_weight", 0.50),
                                description=con_data.get("description", "")
                            )
                            db.add(concept)
                            db.flush()

        # Seed Prerequisites
        for prereq_data in data.get("prerequisites", []):
            from_cid = prereq_data["from_concept"]
            to_cid = prereq_data["to_concept"]
            existing = db.query(Prerequisite).filter(
                Prerequisite.from_concept_id == from_cid,
                Prerequisite.to_concept_id == to_cid
            ).first()
            if not existing:
                prereq = Prerequisite(
                    from_concept_id=from_cid,
                    to_concept_id=to_cid,
                    strength=prereq_data.get("strength", 1.0),
                    relationship_type=prereq_data.get("relationship", "prerequisite"),
                    description=prereq_data.get("description", "")
                )
                db.add(prereq)

    # Seed Questions
    if os.path.exists(questions_dir):
        for filename in os.listdir(questions_dir):
            if not filename.endswith(".json"):
                continue
            filepath = os.path.join(questions_dir, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                q_list = json.load(f)

            for q_data in q_list:
                qid = q_data["question_id"]
                existing_q = db.query(Question).filter(Question.question_id == qid).first()
                c_rec = db.query(Concept).filter(Concept.concept_id == q_data["concept_id"]).first()
                t_id = c_rec.topic_id if c_rec else None
                top_rec = db.query(Topic).filter(Topic.topic_id == t_id).first() if t_id else None
                ch_id = top_rec.chapter_id if top_rec else None

                if not existing_q:
                    question = Question(
                        question_id=q_data["question_id"],
                        exam=q_data["exam"],
                        paper=q_data.get("paper"),
                        subject=q_data["subject"],
                        chapter=q_data["chapter"],
                        topic=q_data["topic"],
                        chapter_id=ch_id,
                        topic_id=t_id,
                        concept_id=q_data["concept_id"],
                        skill=q_data.get("skill", "conceptual"),
                        difficulty=q_data.get("difficulty", 0.5),
                        discrimination=q_data.get("discrimination", 1.0),
                        estimated_time=q_data.get("estimated_time", 60),
                        question_type=q_data.get("question_type", "multiple_choice"),
                        content=q_data["content"],
                        options=q_data.get("options"),
                        correct_answer=q_data["correct_answer"],
                        explanation=q_data.get("explanation", ""),
                        distractor_explanations=q_data.get("distractor_explanations"),
                        rubrics=q_data.get("rubrics"),
                        is_transfer=q_data.get("is_transfer", False),
                        is_prerequisite_check=q_data.get("is_prerequisite_check", False),
                        tier=q_data.get("tier", "STANDARD")
                    )
                    db.add(question)
                else:
                    existing_q.content = q_data["content"]
                    existing_q.options = q_data.get("options")
                    existing_q.correct_answer = q_data["correct_answer"]
                    existing_q.explanation = q_data.get("explanation", "")
                    existing_q.distractor_explanations = q_data.get("distractor_explanations")
                    existing_q.paper = q_data.get("paper")
                    existing_q.difficulty = q_data.get("difficulty", existing_q.difficulty)
                    existing_q.subject = q_data.get("subject", existing_q.subject)
                    existing_q.chapter = q_data.get("chapter", existing_q.chapter)
                    existing_q.topic = q_data.get("topic", existing_q.topic)
                    existing_q.chapter_id = ch_id
                    existing_q.topic_id = t_id
                    existing_q.concept_id = q_data.get("concept_id", existing_q.concept_id)
                    existing_q.tier = q_data.get("tier", getattr(existing_q, "tier", "STANDARD"))

    db.commit()
