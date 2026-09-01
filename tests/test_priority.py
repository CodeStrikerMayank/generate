import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database.connection import Base
from backend.app.models.schema import Exam, Subject, Chapter, Topic, Concept, Prerequisite, StudentConceptMastery, Student
from backend.app.roadmap.priority import PriorityEngine

@pytest.fixture
def priority_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    exam = Exam(exam_id="JEE", name="JEE")
    sub = Subject(subject_id="JEE_MATH", exam_id="JEE", name="Math")
    chap = Chapter(chapter_id="MATH_CALC", subject_id="JEE_MATH", name="Calculus")
    top = Topic(topic_id="MATH_LCD", chapter_id="MATH_CALC", name="LCD")
    session.add_all([exam, sub, chap, top])
    session.flush()

    c1 = Concept(concept_id="c_lim", topic_id="MATH_LCD", name="Limits", exam_relevance=0.95)
    c2 = Concept(concept_id="c_easy", topic_id="MATH_LCD", name="Intro", exam_relevance=0.40)
    session.add_all([c1, c2])

    student = Student(student_id="s1", name="Alice", email="alice@example.com", password_hash="hash", target_exam="JEE")
    session.add(student)
    session.flush()

    # Low mastery in Limits
    m1 = StudentConceptMastery(student_id="s1", concept_id="c_lim", mastery=0.30, confidence=0.80)
    # High mastery in Intro
    m2 = StudentConceptMastery(student_id="s1", concept_id="c_easy", mastery=0.90, confidence=0.85)
    session.add_all([m1, m2])
    session.commit()

    yield session
    session.close()

def test_priority_ranking_and_explanations(priority_db):
    engine = PriorityEngine(priority_db, exam_id="JEE")
    ranked = engine.rank_all_priorities("s1")

    assert len(ranked) == 2
    # Limits (knowledge gap 0.70, exam relevance 0.95) must rank significantly higher than Intro (mastery 0.90)
    assert ranked[0]["concept_id"] == "c_lim"
    assert ranked[0]["priority_score"] > ranked[1]["priority_score"]
    assert len(ranked[0]["reasons"]) > 0
    assert any("knowledge gap" in r.lower() for r in ranked[0]["reasons"])
