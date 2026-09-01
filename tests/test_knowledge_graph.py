import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database.connection import Base
from backend.app.models.schema import Exam, Subject, Chapter, Topic, Concept, Prerequisite, StudentConceptMastery
from backend.app.knowledge_graph.graph import CurriculumGraph
from backend.app.knowledge_graph.prerequisites import PrerequisiteResolver

@pytest.fixture
def graph_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Seed small linear chain: C1 (Functions) -> C2 (Limits) -> C3 (Continuity) -> C4 (Differentiability)
    exam = Exam(exam_id="JEE", name="JEE")
    sub = Subject(subject_id="JEE_MATH", exam_id="JEE", name="Math")
    chap = Chapter(chapter_id="MATH_CALC", subject_id="JEE_MATH", name="Calculus")
    top = Topic(topic_id="MATH_LCD", chapter_id="MATH_CALC", name="LCD")

    session.add_all([exam, sub, chap, top])
    session.flush()

    c1 = Concept(concept_id="c_funcs", topic_id="MATH_LCD", name="Functions")
    c2 = Concept(concept_id="c_limits", topic_id="MATH_LCD", name="Limits")
    c3 = Concept(concept_id="c_cont", topic_id="MATH_LCD", name="Continuity")
    c4 = Concept(concept_id="c_diff", topic_id="MATH_LCD", name="Differentiability")

    session.add_all([c1, c2, c3, c4])
    session.flush()

    p1 = Prerequisite(from_concept_id="c_funcs", to_concept_id="c_limits", strength=0.9)
    p2 = Prerequisite(from_concept_id="c_limits", to_concept_id="c_cont", strength=0.95)
    p3 = Prerequisite(from_concept_id="c_cont", to_concept_id="c_diff", strength=0.95)

    session.add_all([p1, p2, p3])
    session.commit()

    yield session
    session.close()

def test_prerequisite_ancestor_traversal(graph_db):
    graph = CurriculumGraph(graph_db, exam_id="JEE")

    # Direct prerequisite of Differentiability is Continuity
    direct = graph.get_direct_prerequisites("c_diff")
    assert direct == ["c_cont"]

    # All ancestors in topological order: Functions -> Limits -> Continuity
    ancestors = graph.get_all_prerequisites("c_diff")
    assert ancestors == ["c_funcs", "c_limits", "c_cont"]

def test_prerequisite_gap_detection(graph_db):
    graph = CurriculumGraph(graph_db, exam_id="JEE")
    resolver = PrerequisiteResolver(graph_db, graph)

    # Student has good mastery in Functions (0.85), but failed Limits (0.30)
    m1 = StudentConceptMastery(student_id="s1", concept_id="c_funcs", mastery=0.85)
    m2 = StudentConceptMastery(student_id="s1", concept_id="c_limits", mastery=0.30)
    m3 = StudentConceptMastery(student_id="s1", concept_id="c_cont", mastery=0.40)
    m4 = StudentConceptMastery(student_id="s1", concept_id="c_diff", mastery=0.25)
    graph_db.add_all([m1, m2, m3, m4])
    graph_db.commit()

    analysis = resolver.analyze_prerequisite_chain("s1", "c_diff", mastery_threshold=0.60)
    assert analysis["has_prerequisite_gaps"] is True
    # The first broken node in the topological chain should be Limits
    assert analysis["recommended_first_concept"] == "c_limits"
    assert len(analysis["broken_prerequisites"]) == 2  # Limits and Continuity
