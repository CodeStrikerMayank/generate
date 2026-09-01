import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database.connection import Base
from backend.app.student_model.mastery import MasteryEngine, MasteryConfig
from backend.app.models.schema import Student, Assessment, AssessmentAttempt, StudentAttemptItem, Question, Concept

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_confidence_calculation(db_session):
    engine = MasteryEngine(db_session)
    # Zero attempts -> minimal baseline confidence
    c0 = engine.calculate_confidence(0)
    assert 0.08 <= c0 <= 0.15

    # 5 attempts -> moderate confidence
    c5 = engine.calculate_confidence(5)
    assert 0.50 <= c5 <= 0.75

    # 20 attempts -> high confidence
    c20 = engine.calculate_confidence(20)
    assert c20 >= 0.85
    assert c20 > c5 > c0

def test_speed_factor_calculation(db_session):
    engine = MasteryEngine(db_session)
    # Normal pace (within expected time)
    speed_norm = engine.calculate_speed_factor(avg_time_sec=60, expected_time_sec=60)
    assert speed_norm == 1.0

    # Extremely fast (<20% expected time -> possible random guess)
    speed_fast = engine.calculate_speed_factor(avg_time_sec=10, expected_time_sec=60)
    assert speed_fast == 0.50

    # Prolonged struggle (>200% expected time)
    speed_slow = engine.calculate_speed_factor(avg_time_sec=180, expected_time_sec=60)
    assert speed_slow < 0.60
