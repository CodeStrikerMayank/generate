import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from backend.app.database.connection import Base

class Student(Base):
    __tablename__ = "students"

    student_id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    target_exam = Column(String(32), nullable=False, default="JEE")  # JEE, NEET, UPSC
    target_track = Column(String(32), nullable=True)  # JEE_MAIN, JEE_ADVANCED, NEET_UG, UPSC_PRELIMS, UPSC_MAINS
    target_exam_date = Column(DateTime, nullable=True)
    daily_available_hours = Column(Float, default=3.0)
    current_level = Column(String(32), default="BEGINNER")  # BEGINNER, INTERMEDIATE, ADVANCED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_active = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    attempts = relationship("AssessmentAttempt", back_populates="student", cascade="all, delete-orphan")
    masteries = relationship("StudentConceptMastery", back_populates="student", cascade="all, delete-orphan")
    roadmaps = relationship("Roadmap", back_populates="student", cascade="all, delete-orphan")
    events = relationship("LearningEvent", back_populates="student", cascade="all, delete-orphan")
    errors = relationship("StudentErrorLog", back_populates="student", cascade="all, delete-orphan")
    upsc_submissions = relationship("UPSCWrittenSubmission", back_populates="student", cascade="all, delete-orphan")
    assignments = relationship("DailyAssignment", back_populates="student", cascade="all, delete-orphan")


class Exam(Base):
    __tablename__ = "exams"

    exam_id = Column(String(32), primary_key=True)  # JEE, NEET, UPSC
    name = Column(String(128), nullable=False)
    tracks = Column(JSON, nullable=True)  # ["JEE_MAIN", "JEE_ADVANCED"]

    subjects = relationship("Subject", back_populates="exam", cascade="all, delete-orphan")


class Subject(Base):
    __tablename__ = "subjects"

    subject_id = Column(String(64), primary_key=True)
    exam_id = Column(String(32), ForeignKey("exams.exam_id"), nullable=False)
    name = Column(String(128), nullable=False)

    exam = relationship("Exam", back_populates="subjects")
    chapters = relationship("Chapter", back_populates="subject", cascade="all, delete-orphan")


class Chapter(Base):
    __tablename__ = "chapters"

    chapter_id = Column(String(64), primary_key=True)
    subject_id = Column(String(64), ForeignKey("subjects.subject_id"), nullable=False)
    name = Column(String(128), nullable=False)

    subject = relationship("Subject", back_populates="chapters")
    topics = relationship("Topic", back_populates="chapter", cascade="all, delete-orphan")


class Topic(Base):
    __tablename__ = "topics"

    topic_id = Column(String(64), primary_key=True)
    chapter_id = Column(String(64), ForeignKey("chapters.chapter_id"), nullable=False)
    name = Column(String(128), nullable=False)

    chapter = relationship("Chapter", back_populates="topics")
    concepts = relationship("Concept", back_populates="topic", cascade="all, delete-orphan")


class Concept(Base):
    __tablename__ = "concepts"

    concept_id = Column(String(64), primary_key=True, index=True)
    topic_id = Column(String(64), ForeignKey("topics.topic_id"), nullable=False)
    name = Column(String(128), nullable=False)
    estimated_minutes = Column(Integer, default=45)
    exam_relevance = Column(Float, default=0.85)  # 0.0 - 1.0
    difficulty_weight = Column(Float, default=0.50)  # 0.0 - 1.0
    description = Column(Text, nullable=True)

    topic = relationship("Topic", back_populates="concepts")
    questions = relationship("Question", back_populates="concept", cascade="all, delete-orphan")
    masteries = relationship("StudentConceptMastery", back_populates="concept", cascade="all, delete-orphan")


class Prerequisite(Base):
    __tablename__ = "prerequisites"

    id = Column(Integer, primary_key=True, autoincrement=True)
    from_concept_id = Column(String(64), ForeignKey("concepts.concept_id"), nullable=False, index=True)
    to_concept_id = Column(String(64), ForeignKey("concepts.concept_id"), nullable=False, index=True)
    strength = Column(Float, default=1.0)  # 0.0 - 1.0
    relationship_type = Column(String(32), default="prerequisite")
    description = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("from_concept_id", "to_concept_id", name="uq_prereq_pair"),
    )


class Question(Base):
    __tablename__ = "questions"

    question_id = Column(String(64), primary_key=True, index=True)
    exam = Column(String(32), nullable=False, index=True)  # JEE, NEET, UPSC
    paper = Column(String(32), nullable=True)  # MAIN, ADVANCED, NEET_UG, PRELIMS_GS, MAINS_GS1
    subject = Column(String(64), nullable=False)
    chapter = Column(String(64), nullable=False)
    topic = Column(String(64), nullable=False)
    chapter_id = Column(String(64), nullable=True, index=True)
    topic_id = Column(String(64), nullable=True, index=True)
    concept_id = Column(String(64), ForeignKey("concepts.concept_id"), nullable=False, index=True)
    skill = Column(String(64), default="conceptual")  # conceptual, numerical, multi_step, reasoning, factual_recall, case_study, analytical_writing
    difficulty = Column(Float, default=0.50)  # 0.0 - 1.0
    discrimination = Column(Float, default=1.0)  # IRT parameter
    guessing = Column(Float, default=0.25)  # IRT 3PL parameter
    estimated_time = Column(Integer, default=60)  # in seconds
    question_type = Column(String(32), default="multiple_choice")  # multiple_choice, numerical, descriptive
    content = Column(Text, nullable=False)
    options = Column(JSON, nullable=True)  # [{"id": "A", "text": "..."}]
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    distractor_explanations = Column(JSON, nullable=True)  # {"B": "CALCULATION_ERROR: ..."}
    rubrics = Column(JSON, nullable=True)  # for descriptive questions
    is_transfer = Column(Boolean, default=False)
    is_prerequisite_check = Column(Boolean, default=False)
    tier = Column(String(32), default="STANDARD", index=True)  # STANDARD, ADVANCED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    concept = relationship("Concept", back_populates="questions")


class Assessment(Base):
    __tablename__ = "assessments"

    assessment_id = Column(String(64), primary_key=True, index=True)
    exam = Column(String(32), nullable=False)
    title = Column(String(256), nullable=False)
    assessment_type = Column(String(32), default="DIAGNOSTIC")  # DIAGNOSTIC, CONCEPT_FOCUS, RETENTION, TRANSFER, MOCK
    stage = Column(Integer, default=1)  # 1: Baseline, 2: Concept deep-dive, 3: Difficulty calibration, etc.
    duration_minutes = Column(Integer, default=30)
    is_strict_timed = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    attempts = relationship("AssessmentAttempt", back_populates="assessment", cascade="all, delete-orphan")


class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    attempt_id = Column(String(64), primary_key=True, index=True)
    assessment_id = Column(String(64), ForeignKey("assessments.assessment_id"), nullable=False)
    student_id = Column(String(64), ForeignKey("students.student_id"), nullable=False, index=True)
    session_id = Column(String(64), nullable=False, index=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    time_taken_seconds = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    score_percentage = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    status = Column(String(32), default="IN_PROGRESS")  # IN_PROGRESS, COMPLETED, AUTO_SUBMITTED, TIMED_OUT
    test_tier = Column(String(32), default="SCREENER")  # SCREENER, TOPIC_DRILL, FULL_SCAN

    student = relationship("Student", back_populates="attempts")
    assessment = relationship("Assessment", back_populates="attempts")
    item_responses = relationship("StudentAttemptItem", back_populates="attempt", cascade="all, delete-orphan")


class StudentAttemptItem(Base):
    __tablename__ = "student_attempt_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    attempt_id = Column(String(64), ForeignKey("assessment_attempts.attempt_id"), nullable=False, index=True)
    question_id = Column(String(64), ForeignKey("questions.question_id"), nullable=False, index=True)
    concept_id = Column(String(64), ForeignKey("concepts.concept_id"), nullable=False, index=True)
    student_answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, default=False)
    time_taken_seconds = Column(Integer, default=0)
    difficulty = Column(Float, default=0.50)
    confidence_estimate = Column(Float, default=0.50)
    error_type = Column(String(64), nullable=True)  # CONCEPTUAL_ERROR, CALCULATION_ERROR, TIME_PRESSURE, etc.
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    attempt = relationship("AssessmentAttempt", back_populates="item_responses")


class StudentConceptMastery(Base):
    __tablename__ = "student_concept_mastery"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(64), ForeignKey("students.student_id"), nullable=False, index=True)
    concept_id = Column(String(64), ForeignKey("concepts.concept_id"), nullable=False, index=True)
    mastery = Column(Float, default=0.0)  # 0.0 - 1.0
    confidence = Column(Float, default=0.0)  # 0.0 - 1.0 (sample size & uncertainty calibrated)
    bkt_mastery = Column(Float, default=0.0)
    irt_ability = Column(Float, default=0.0)
    attempts_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    recent_accuracy = Column(Float, default=0.0)  # last 5 attempts
    historical_accuracy = Column(Float, default=0.0)
    average_response_time = Column(Float, default=0.0)  # seconds
    difficulty_success_rate = Column(JSON, default=dict)  # {"easy": 0.9, "medium": 0.7, "hard": 0.3}
    retention_score = Column(Float, default=1.0)
    forgetting_risk = Column(Float, default=0.0)
    learning_velocity = Column(Float, default=0.0)
    last_practiced_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="masteries")
    concept = relationship("Concept", back_populates="masteries")

    __table_args__ = (
        UniqueConstraint("student_id", "concept_id", name="uq_student_concept"),
    )


class StudentErrorLog(Base):
    __tablename__ = "student_error_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(64), ForeignKey("students.student_id"), nullable=False, index=True)
    question_id = Column(String(64), ForeignKey("questions.question_id"), nullable=False)
    concept_id = Column(String(64), ForeignKey("concepts.concept_id"), nullable=False, index=True)
    error_type = Column(String(64), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    student = relationship("Student", back_populates="errors")


class LearningEvent(Base):
    __tablename__ = "learning_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(64), unique=True, index=True, nullable=False)
    student_id = Column(String(64), ForeignKey("students.student_id"), nullable=False, index=True)
    session_id = Column(String(64), nullable=False, index=True)
    event_type = Column(String(64), nullable=False, index=True)
    resource_id = Column(String(64), nullable=True)
    concept_id = Column(String(64), nullable=True, index=True)
    metadata_payload = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    student = relationship("Student", back_populates="events")


class Roadmap(Base):
    __tablename__ = "roadmaps"

    roadmap_id = Column(String(64), primary_key=True, index=True)
    student_id = Column(String(64), ForeignKey("students.student_id"), nullable=False, index=True)
    version = Column(Integer, default=1)
    status = Column(String(32), default="ACTIVE")  # ACTIVE, ARCHIVED, SUPERSEDED
    trigger_event = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="roadmaps")
    actions = relationship("RoadmapAction", back_populates="roadmap", cascade="all, delete-orphan")


class RoadmapAction(Base):
    __tablename__ = "roadmap_actions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    roadmap_id = Column(String(64), ForeignKey("roadmaps.roadmap_id"), nullable=False, index=True)
    sequence_order = Column(Integer, nullable=False)
    action_type = Column(String(64), nullable=False)  # LEARN_CONCEPT, REVIEW_CONCEPT, BASIC_PRACTICE, MEDIUM_PRACTICE, HARD_PRACTICE, RETENTION_TEST, TRANSFER_TEST, MOCK_TEST
    concept_id = Column(String(64), ForeignKey("concepts.concept_id"), nullable=False)
    priority_score = Column(Float, default=0.5)
    reasons = Column(JSON, default=list)  # ["low mastery (0.34)", "prerequisite for Continuity", ...]
    target_questions_count = Column(Integer, default=5)
    estimated_minutes = Column(Integer, default=30)
    target_difficulty = Column(Float, default=0.5)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)

    roadmap = relationship("Roadmap", back_populates="actions")


class UPSCWrittenSubmission(Base):
    __tablename__ = "upsc_written_submissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    submission_id = Column(String(64), unique=True, index=True, nullable=False)
    student_id = Column(String(64), ForeignKey("students.student_id"), nullable=False, index=True)
    question_id = Column(String(64), ForeignKey("questions.question_id"), nullable=False)
    student_answer_text = Column(Text, nullable=False)
    word_count = Column(Integer, default=0)
    time_taken_seconds = Column(Integer, default=0)
    rubric_scores = Column(JSON, default=dict)  # {"understanding": 2.2, "structure": 1.8, ...}
    total_score = Column(Float, default=0.0)
    max_score = Column(Float, default=15.0)
    ai_feedback_summary = Column(Text, nullable=True)
    evaluator_type = Column(String(32), default="RULE_RUBRIC_AI")  # RULE_RUBRIC_AI, HUMAN_VERIFIED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="upsc_submissions")


class DailyAssignment(Base):
    __tablename__ = "daily_assignments"

    assignment_id = Column(String(64), primary_key=True, index=True)
    student_id = Column(String(64), ForeignKey("students.student_id"), nullable=False, index=True)
    exam = Column(String(32), nullable=False, index=True)  # JEE, NEET, etc.
    assignment_date = Column(String(16), nullable=False, index=True)  # YYYY-MM-DD
    title = Column(String(128), nullable=False)
    status = Column(String(32), default="IN_PROGRESS")  # IN_PROGRESS, COMPLETED
    total_questions = Column(Integer, default=60)
    completed_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    score_percentage = Column(Float, default=0.0)
    time_taken_seconds = Column(Integer, default=0)
    subject_scores = Column(JSON, default=dict)  # {"Physics": {"correct": 16, "total": 20, "score_pct": 80.0}, ...}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)

    student = relationship("Student", back_populates="assignments")
    items = relationship("DailyAssignmentItem", back_populates="assignment", cascade="all, delete-orphan")


class DailyAssignmentItem(Base):
    __tablename__ = "daily_assignment_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    assignment_id = Column(String(64), ForeignKey("daily_assignments.assignment_id"), nullable=False, index=True)
    question_id = Column(String(64), ForeignKey("questions.question_id"), nullable=False, index=True)
    subject = Column(String(64), nullable=False, index=True)
    sequence_index = Column(Integer, nullable=False)
    student_answer = Column(String(8), nullable=True)
    is_correct = Column(Boolean, nullable=True)
    is_marked_review = Column(Boolean, default=False)
    time_taken_seconds = Column(Integer, default=0)

    assignment = relationship("DailyAssignment", back_populates="items")
    question = relationship("Question")
