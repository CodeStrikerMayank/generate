import math
from typing import Dict, Any, List, Optional
import datetime
from sqlalchemy.orm import Session
from backend.app.models.schema import StudentConceptMastery, StudentAttemptItem, Question

class MasteryConfig:
    """Configurable weights for transparent baseline student mastery calculation."""
    WEIGHT_ACCURACY: float = 0.30
    WEIGHT_DIFFICULTY_PERF: float = 0.20
    WEIGHT_RECENT_ACCURACY: float = 0.15
    WEIGHT_RETENTION: float = 0.15
    WEIGHT_CONSISTENCY: float = 0.10
    WEIGHT_SPEED: float = 0.10

    # Confidence scaling (reaches 0.90+ after ~15-20 attempts)
    SAMPLE_SIZE_HALF_CONFIDENCE: float = 5.0

class MasteryEngine:
    """
    Computes transparent multi-factor mastery and confidence for concepts.
    Exposes uniform estimate_mastery interface.
    """
    def __init__(self, db: Session, config: Optional[MasteryConfig] = None):
        self.db = db
        self.config = config or MasteryConfig()

    def calculate_confidence(self, attempt_count: int, variance: float = 0.0) -> float:
        """
        Calculates confidence in the mastery estimate based on observation volume and consistency.
        Confidence approaches 1.0 asymptotically with number of attempts.
        """
        if attempt_count <= 0:
            return 0.10
        # Sigmoidal sample volume curve
        sample_factor = 1.0 - math.exp(-attempt_count / self.config.SAMPLE_SIZE_HALF_CONFIDENCE)
        # Low variance in performance gives higher confidence
        consistency_bonus = max(0.0, 1.0 - variance) * 0.15
        confidence = 0.85 * sample_factor + consistency_bonus
        return round(min(max(confidence, 0.10), 0.98), 3)

    def calculate_speed_factor(self, avg_time_sec: float, expected_time_sec: float) -> float:
        """
        Evaluates speed performance. Answering within reasonable expected time gives high factor.
        Extreme rushing (<20% expected time) or severe dragging (>300% expected time) penalizes.
        """
        if expected_time_sec <= 0:
            expected_time_sec = 60.0
        ratio = avg_time_sec / expected_time_sec
        if ratio <= 0.2:  # Possible blind guess
            return 0.50
        elif ratio <= 1.0:  # Optimal fast response
            return 1.0
        elif ratio <= 2.0:  # Acceptable pace
            return max(0.60, 1.0 - 0.4 * (ratio - 1.0))
        else:  # Time pressure / struggling
            return max(0.30, 0.60 - 0.15 * (ratio - 2.0))

    def evaluate_concept_from_attempts(
        self,
        student_id: str,
        concept_id: str,
        recent_window: int = 5
    ) -> Dict[str, Any]:
        """
        Re-computes full concept mastery metrics from all recorded item attempts.
        """
        items = (
            self.db.query(StudentAttemptItem)
            .join(Question, StudentAttemptItem.question_id == Question.question_id)
            .filter(
                StudentAttemptItem.concept_id == concept_id,
                StudentAttemptItem.attempt.has(student_id=student_id)
            )
            .order_by(StudentAttemptItem.timestamp.asc())
            .all()
        )

        if not items:
            return {
                "mastery": 0.0,
                "confidence": 0.10,
                "attempts_count": 0,
                "correct_count": 0,
                "recent_accuracy": 0.0,
                "historical_accuracy": 0.0,
                "average_time": 0.0,
                "retention_score": 1.0,
                "forgetting_risk": 0.0,
                "difficulty_success": {}
            }

        total_attempts = len(items)
        correct_count = sum(1 for i in items if i.is_correct)
        historical_accuracy = correct_count / total_attempts

        # Recent accuracy over the last N attempts
        recent_items = items[-recent_window:]
        recent_accuracy = sum(1 for i in recent_items if i.is_correct) / len(recent_items)

        # Difficulty performance: weighted accuracy on harder vs easier questions
        diff_weighted_score = 0.0
        diff_weights_sum = 0.0
        diff_buckets = {"easy": [], "medium": [], "hard": []}

        for item in items:
            diff = item.difficulty if item.difficulty else 0.5
            w = 0.5 + diff  # Harder questions carry more diagnostic weight
            diff_weights_sum += w
            if item.is_correct:
                diff_weighted_score += w

            if diff < 0.45:
                diff_buckets["easy"].append(item.is_correct)
            elif diff < 0.75:
                diff_buckets["medium"].append(item.is_correct)
            else:
                diff_buckets["hard"].append(item.is_correct)

        difficulty_performance = diff_weighted_score / max(diff_weights_sum, 1e-6)

        difficulty_success = {
            k: (sum(1 for v in vals if v) / len(vals)) if vals else 0.0
            for k, vals in diff_buckets.items()
        }

        # Average response time vs expected question time
        total_time = sum(i.time_taken_seconds for i in items)
        avg_time = total_time / total_attempts
        speed_factor = self.calculate_speed_factor(avg_time, expected_time_sec=75.0)

        # Consistency: variance in recent responses
        scores = [1.0 if i.is_correct else 0.0 for i in items]
        mean_score = sum(scores) / len(scores)
        variance = sum((s - mean_score) ** 2 for s in scores) / len(scores) if len(scores) > 1 else 0.25
        consistency_factor = max(0.0, 1.0 - variance)

        # Baseline weighted mastery formula
        raw_mastery = (
            self.config.WEIGHT_ACCURACY * historical_accuracy +
            self.config.WEIGHT_DIFFICULTY_PERF * difficulty_performance +
            self.config.WEIGHT_RECENT_ACCURACY * recent_accuracy +
            self.config.WEIGHT_RETENTION * 1.0 +  # Retention decay applied separately
            self.config.WEIGHT_CONSISTENCY * consistency_factor +
            self.config.WEIGHT_SPEED * speed_factor
        )

        mastery = round(min(max(raw_mastery, 0.0), 1.0), 3)
        confidence = self.calculate_confidence(total_attempts, variance)

        return {
            "mastery": mastery,
            "confidence": confidence,
            "attempts_count": total_attempts,
            "correct_count": correct_count,
            "recent_accuracy": round(recent_accuracy, 3),
            "historical_accuracy": round(historical_accuracy, 3),
            "average_time": round(avg_time, 1),
            "retention_score": 1.0,
            "forgetting_risk": 0.0,
            "difficulty_success": difficulty_success,
            "last_practiced_at": items[-1].timestamp if items else None
        }

    def estimate_mastery(self, student_id: str, concept_id: str) -> Dict[str, float]:
        """
        Universal interface exposing estimated latent mastery and confidence.
        Can seamlessly swap between Baseline, BKT, and IRT models.
        """
        record = self.db.query(StudentConceptMastery).filter(
            StudentConceptMastery.student_id == student_id,
            StudentConceptMastery.concept_id == concept_id
        ).first()

        if record:
            return {
                "mastery": record.mastery,
                "confidence": record.confidence,
                "bkt_mastery": record.bkt_mastery,
                "irt_ability": record.irt_ability
            }

        # Fallback to computing live from attempts
        metrics = self.evaluate_concept_from_attempts(student_id, concept_id)
        return {
            "mastery": metrics["mastery"],
            "confidence": metrics["confidence"],
            "bkt_mastery": 0.0,
            "irt_ability": 0.0
        }
