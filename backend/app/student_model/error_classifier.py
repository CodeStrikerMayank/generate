from typing import Optional, Dict, Any

class ErrorClassifier:
    """
    Classifies student errors based on question distractors, response time anomalies, and attempt patterns.
    """
    @staticmethod
    def classify_error(
        question_distractor_explanations: Optional[Dict[str, str]],
        student_answer: Optional[str],
        correct_answer: str,
        time_taken_seconds: int,
        estimated_time_seconds: int = 60
    ) -> Dict[str, Any]:
        """
        Determines the most probable root cause error category.
        """
        if student_answer == correct_answer:
            return {"error_type": None, "note": "Correct response."}

        if not student_answer:
            return {
                "error_type": "TIME_PRESSURE" if time_taken_seconds >= estimated_time_seconds else "SKIPPED",
                "note": "Question was skipped or timed out without answer selection."
            }

        # Check if question distractor metadata contains an explicit tag
        if question_distractor_explanations and student_answer in question_distractor_explanations:
            raw_text = question_distractor_explanations[student_answer]
            for tag in [
                "CONCEPTUAL_ERROR", "FORMULA_SELECTION_ERROR", "CALCULATION_ERROR",
                "SIGN_ERROR", "UNIT_ERROR", "READING_ERROR", "CARELESS_ERROR"
            ]:
                if tag in raw_text:
                    return {
                        "error_type": tag,
                        "note": raw_text
                    }

        # Fast response with wrong answer -> likely careless or guess
        if time_taken_seconds < max(10, estimated_time_seconds * 0.20):
            return {
                "error_type": "GUESS",
                "note": f"Answer submitted very rapidly ({time_taken_seconds}s vs {estimated_time_seconds}s expected)."
            }

        # Prolonged response with wrong answer -> concept or calculation struggle
        if time_taken_seconds > estimated_time_seconds * 2.0:
            return {
                "error_type": "CONCEPTUAL_ERROR",
                "note": f"Significant deliberation time ({time_taken_seconds}s), indicating conceptual struggle."
            }

        return {
            "error_type": "UNKNOWN",
            "note": "Standard incorrect attempt."
        }
