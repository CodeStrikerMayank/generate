import math
import datetime
from typing import Dict, Any, Optional

class ForgettingModel:
    """
    Ebbinghaus-based exponential forgetting and retention decay engine.
    Calculates current effective retention and forgetting risk over time elapsed.
    """
    def __init__(
        self,
        base_half_life_days: float = 7.0,
        reinforcement_multiplier: float = 0.50,
        floor_retention: float = 0.35
    ):
        self.base_half_life_days = base_half_life_days
        self.reinforcement_multiplier = reinforcement_multiplier
        self.floor_retention = floor_retention

    def calculate_retention(
        self,
        base_mastery: float,
        last_practiced_at: Optional[datetime.datetime],
        review_count: int = 0,
        now: Optional[datetime.datetime] = None
    ) -> Dict[str, float]:
        """
        Calculates retention score, effective decayed mastery, and forgetting risk.
        Successive reviews increase the stability/half-life of the memory trace.
        """
        if base_mastery <= 0.0 or not last_practiced_at:
            return {
                "retention_score": 1.0,
                "effective_mastery": base_mastery,
                "forgetting_risk": 0.0,
                "days_since_practice": 0.0
            }

        now = now or datetime.datetime.now(datetime.timezone.utc)
        # Ensure timezone-naive comparison if needed
        if last_practiced_at.tzinfo is not None and now.tzinfo is None:
            now = now.replace(tzinfo=datetime.timezone.utc)
        elif last_practiced_at.tzinfo is None and now.tzinfo is not None:
            now = now.replace(tzinfo=None)

        elapsed_seconds = max(0.0, (now - last_practiced_at).total_seconds())
        days_elapsed = elapsed_seconds / 86400.0

        # Memory stability S increases with spaced repetitions
        stability_days = self.base_half_life_days * (1.0 + review_count * self.reinforcement_multiplier)
        decay_constant = math.log(2) / stability_days

        # Exponential retention R(t) = exp(-decay * t)
        retention = math.exp(-decay_constant * days_elapsed)
        retention_clamped = max(self.floor_retention, min(1.0, retention))

        # Effective mastery decays towards the floor, never destroying mastery instantly
        effective_mastery = round(base_mastery * retention_clamped, 3)
        forgetting_risk = round(max(0.0, 1.0 - retention_clamped), 3)

        return {
            "retention_score": round(retention_clamped, 3),
            "effective_mastery": effective_mastery,
            "forgetting_risk": forgetting_risk,
            "days_since_practice": round(days_elapsed, 2)
        }
