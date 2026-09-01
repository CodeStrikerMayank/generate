import datetime
from typing import Dict, Any, Optional

class AssessmentTimer:
    """
    Server-side timer verification ensuring strict assessment duration integrity.
    """
    @staticmethod
    def verify_attempt_timing(
        started_at: datetime.datetime,
        duration_minutes: int,
        submission_time: Optional[datetime.datetime] = None,
        grace_period_seconds: int = 60
    ) -> Dict[str, Any]:
        """
        Validates if submission is within allowable server-side duration.
        """
        now = submission_time or datetime.datetime.utcnow()
        elapsed_seconds = int((now - started_at).total_seconds())
        allowed_seconds = (duration_minutes * 60) + grace_period_seconds

        is_timed_out = elapsed_seconds > allowed_seconds
        remaining_seconds = max(0, (duration_minutes * 60) - elapsed_seconds)

        return {
            "elapsed_seconds": elapsed_seconds,
            "allowed_seconds": allowed_seconds,
            "remaining_seconds": remaining_seconds,
            "is_timed_out": is_timed_out,
            "auto_submitted": is_timed_out
        }
