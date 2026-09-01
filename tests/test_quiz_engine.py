import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database.connection import Base
from backend.app.models.schema import (
    Exam, Subject, Chapter, Topic, Concept, Question, Student,
    AssessmentAttempt, StudentAttemptItem, StudentConceptMastery
)
from backend.app.assessment.quiz_engine import QuizEngine

@pytest.fixture
def quiz_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    exam = Exam(exam_id="JEE", name="JEE")
    sub = Subject(subject_id="JEE_PHY", exam_id="JEE", name="Physics")
    chap = Chapter(chapter_id="PHY_MECH", subject_id="JEE_PHY", name="Mechanics")
    top = Topic(topic_id="PHY_NLM", chapter_id="PHY_MECH", name="NLM")
    session.add_all([exam, sub, chap, top])
    session.flush()

    c1 = Concept(concept_id="phy_fbd", topic_id="PHY_NLM", name="FBD")
    session.add(c1)
    session.flush()

    q1 = Question(
        question_id="Q_FBD_01",
        exam="JEE",
        subject="Physics",
        chapter="Mechanics",
        topic="NLM",
        concept_id="phy_fbd",
        difficulty=0.5,
        discrimination=1.2,
        estimated_time=60,
        question_type="multiple_choice",
        content="What is net force at equilibrium?",
        options=[{"id": "A", "text": "0 N"}, {"id": "B", "text": "10 N"}],
        correct_answer="A",
        explanation="Net force is zero in static equilibrium.",
        distractor_explanations={"B": "CONCEPTUAL_ERROR: Equilibrium means sum of forces is zero."}
    )
    session.add(q1)

    student = Student(student_id="s1", name="Dev", email="dev@example.com", password_hash="hash", target_exam="JEE")
    session.add(student)
    session.commit()

    yield session
    session.close()

def test_quiz_lifecycle_and_grading(quiz_db):
    engine = QuizEngine(quiz_db)

    # 1. Start assessment
    start_data = engine.start_assessment(
        student_id="s1",
        exam="JEE",
        assessment_type="DIAGNOSTIC",
        stage=1,
        duration_minutes=15
    )

    attempt_id = start_data["attempt_id"]
    assert attempt_id is not None
    assert start_data["total_questions"] >= 1

    # 2. Submit correct response
    submit_res = engine.submit_assessment(
        attempt_id=attempt_id,
        responses=[
            {
                "question_id": "Q_FBD_01",
                "student_answer": "A",
                "time_taken_seconds": 45,
                "confidence_estimate": 0.8
            }
        ]
    )

    assert submit_res["score_percentage"] == 100.0
    assert submit_res["correct_count"] == 1
    assert submit_res["items_feedback"][0]["is_correct"] is True

    # 3. Check student concept mastery updated in DB
    m_rec = quiz_db.query(StudentConceptMastery).filter(
        StudentConceptMastery.student_id == "s1",
        StudentConceptMastery.concept_id == "phy_fbd"
    ).first()

    assert m_rec is not None
    assert m_rec.attempts_count == 1
    assert m_rec.correct_count == 1
    assert m_rec.mastery > 0.0
