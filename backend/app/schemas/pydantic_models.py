from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import datetime

# --- Student Authentication & Profile ---
class StudentRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    email: str = Field(..., min_length=3, max_length=128)
    password: str = Field(..., min_length=4)
    target_exam: str = Field("JEE", description="JEE, NEET, or UPSC")
    target_track: Optional[str] = None
    daily_available_hours: float = 3.0

class StudentLoginRequest(BaseModel):
    email: str
    password: str

class StudentProfileResponse(BaseModel):
    student_id: str
    name: str
    email: str
    target_exam: str
    target_track: Optional[str]
    daily_available_hours: float
    current_level: str
    overall_mastery: float = 0.0
    overall_confidence: float = 0.0
    created_at: datetime.datetime

# --- Curriculum & Knowledge Graph ---
class ConceptDetail(BaseModel):
    concept_id: str
    topic_id: str
    name: str
    estimated_minutes: int
    exam_relevance: float
    difficulty_weight: float
    description: Optional[str]
    current_mastery: Optional[float] = 0.0
    current_confidence: Optional[float] = 0.0

class PrerequisiteDetail(BaseModel):
    from_concept_id: str
    to_concept_id: str
    strength: float
    relationship_type: str
    description: Optional[str]

class KnowledgeGraphResponse(BaseModel):
    exam: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

# --- Questions & Assessments ---
class QuestionOption(BaseModel):
    id: str
    text: str

class QuestionDisplay(BaseModel):
    question_id: str
    exam: str
    subject: str
    chapter: str
    topic: str
    concept_id: str
    skill: str
    difficulty: float
    estimated_time: int
    question_type: str
    content: str
    options: Optional[List[QuestionOption]] = None
    rubrics: Optional[Dict[str, Any]] = None

class QuestionAnswerSubmission(BaseModel):
    question_id: str
    student_answer: Optional[str] = None
    time_taken_seconds: int = 0
    confidence_estimate: Optional[float] = 0.5

class AssessmentStartRequest(BaseModel):
    exam: str = "JEE"
    assessment_type: str = "DIAGNOSTIC"
    stage: int = 1
    duration_minutes: Optional[int] = 30
    target_concept_id: Optional[str] = None

class AssessmentSessionResponse(BaseModel):
    attempt_id: str
    assessment_id: str
    session_id: str
    exam: str
    title: str
    test_tier: Optional[str] = "SCREENER"
    assessment_type: str
    duration_minutes: int
    total_questions: int
    questions: List[QuestionDisplay]
    started_at: datetime.datetime

class AssessmentSubmitRequest(BaseModel):
    attempt_id: str
    responses: List[QuestionAnswerSubmission]

class AssessmentItemFeedback(BaseModel):
    question_id: str
    concept_id: str
    student_answer: Optional[str]
    correct_answer: str
    is_correct: bool
    time_taken_seconds: int
    difficulty: float
    explanation: str
    error_type: Optional[str]
    distractor_note: Optional[str]

class AssessmentResultResponse(BaseModel):
    attempt_id: str
    test_tier: Optional[str] = "SCREENER"
    total_questions: int
    correct_count: int
    score_percentage: float
    time_taken_seconds: int
    status: str
    weak_subjects: Optional[List[Dict[str, Any]]] = None
    advanced_challenge_eligible: Optional[bool] = False
    items_feedback: List[AssessmentItemFeedback]
    updated_masteries: List[Dict[str, Any]]
    new_roadmap_summary: Optional[Dict[str, Any]]

# --- Telemetry & Events ---
class TelemetryEventCreate(BaseModel):
    session_id: str
    event_type: str
    resource_id: Optional[str] = None
    concept_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

# --- Student Modeling & Knowledge Tracing ---
class MasteryEstimateResponse(BaseModel):
    concept_id: str
    concept_name: str
    mastery: float
    confidence: float
    bkt_mastery: float
    irt_ability: float
    attempts_count: int
    correct_count: int
    recent_accuracy: float
    historical_accuracy: float
    retention_score: float
    forgetting_risk: float
    average_response_time: float
    learning_velocity: float
    last_practiced_at: Optional[datetime.datetime]

# --- Priority Engine & Weakness ---
class WeaknessDetail(BaseModel):
    concept_id: str
    concept_name: str
    subject: str
    chapter: str
    mastery: float
    confidence: float
    forgetting_risk: float
    weakness_type: str  # FOUNDATIONAL_PREREQUISITE_GAP, HIGH_FORGETTING_RISK, UNSTABLE_MASTERY, SPEED_ISSUE
    reasons: List[str]

class PriorityItem(BaseModel):
    concept_id: str
    concept_name: str
    priority_score: float
    knowledge_gap: float
    exam_importance: float
    prerequisite_impact: float
    forgetting_risk: float
    confidence_factor: float
    reasons: List[str]

# --- Roadmap & Next Best Action ---
class RoadmapActionItem(BaseModel):
    sequence_order: int
    action_type: str
    concept_id: str
    concept_name: str
    subject: str
    priority_score: float
    reasons: List[str]
    target_questions_count: int
    estimated_minutes: int
    target_difficulty: float
    is_completed: bool

class NextActionResponse(BaseModel):
    action_type: str
    concept_id: str
    concept_name: str
    subject: str
    chapter: str
    reasons: List[str]
    estimated_minutes: int
    target_questions_count: int
    target_difficulty: float
    explanation_summary: str

class RoadmapResponse(BaseModel):
    roadmap_id: str
    student_id: str
    version: int
    created_at: datetime.datetime
    next_best_action: Optional[NextActionResponse]
    actions: List[RoadmapActionItem]

# --- UPSC Written Answer Subsystem ---
class UPSCWrittenSubmissionRequest(BaseModel):
    question_id: str
    answer_text: str
    time_taken_seconds: int

class UPSCWrittenEvaluationResponse(BaseModel):
    submission_id: str
    question_id: str
    word_count: int
    time_taken_seconds: int
    rubric_scores: Dict[str, float]
    total_score: float
    max_score: float
    ai_feedback_summary: str
    evaluator_type: str

# --- Offline AI Assistant ---
class AIChatRequest(BaseModel):
    prompt: str
    concept_id: Optional[str] = None
    include_student_state: bool = True

class AIChatResponse(BaseModel):
    response: str
    source: str = "OFFLINE_LLM_OR_RULE_FALLBACK"

class AIQuestionGenRequest(BaseModel):
    exam: str
    subject: str
    chapter: str
    concept_id: str
    difficulty: float
    question_type: str = "multiple_choice"
