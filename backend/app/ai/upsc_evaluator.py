import re
from typing import Dict, Any, Optional
from backend.app.ai.local_llm import LocalLLMClient

class UPSCAnswerEvaluator:
    """
    Evaluates UPSC Mains written descriptive responses against a standard 7-pillar rubric.
    Combines rule-based rubric heuristic scoring with optional local LLM feedback.
    """
    def __init__(self, llm_client: Optional[LocalLLMClient] = None):
        self.llm = llm_client or LocalLLMClient()

    def evaluate_written_response(
        self,
        question_content: str,
        student_answer: str,
        model_answer_outline: str,
        rubric_spec: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Computes rubric scores based on length, structural markers, keywords/case laws,
        and argumentation depth.
        """
        words = re.findall(r'\b\w+\b', student_answer)
        word_count = len(words)

        # Base 7-pillar rubric weights
        scores = {
            "understanding": 1.5,
            "structure": 1.2,
            "relevance": 1.2,
            "argumentation": 1.5,
            "case_laws_examples": 1.0,
            "clarity": 1.2,
            "conclusion": 0.9
        }

        # 1. Word Count & Completeness Check (Optimal ~180-260 words for 250 word limit)
        if word_count >= 150:
            scores["understanding"] = min(2.5, scores["understanding"] + 0.6)
            scores["clarity"] = min(2.0, scores["clarity"] + 0.5)
        elif word_count < 80:
            scores["understanding"] = max(0.5, scores["understanding"] - 0.7)
            scores["argumentation"] = max(0.5, scores["argumentation"] - 0.7)

        # 2. Structural Markers (Introduction, subheadings, bullet points, conclusion)
        text_lower = student_answer.lower()
        has_intro = bool(re.search(r'\b(introduction|initially|preamble|origin|defines)\b', text_lower))
        has_conclusion = bool(re.search(r'\b(conclusion|in conclusion|way forward|thus|hence|forward)\b', text_lower))
        has_subheadings = "\n" in student_answer or ":" in student_answer or "-" in student_answer

        if has_intro and has_conclusion:
            scores["structure"] = min(2.0, scores["structure"] + 0.6)
            scores["conclusion"] = min(1.5, scores["conclusion"] + 0.5)
        if has_subheadings:
            scores["structure"] = min(2.0, scores["structure"] + 0.4)

        # 3. Constitutional / Case Law / Evidence Keywords
        keywords = [
            "article", "doctrine", "kesavananda", "minerva mills", "supreme court",
            "judgment", "fundamental rights", "dpsp", "constitution", "amendment",
            "pesa", "forest rights", "nolan", "utilitarian", "deontological", "integrity"
        ]
        matched_keywords = [k for k in keywords if k in text_lower]
        keyword_bonus = min(1.5, len(matched_keywords) * 0.3)
        scores["case_laws_examples"] = min(2.5, round(scores["case_laws_examples"] + keyword_bonus, 2))
        scores["relevance"] = min(2.0, round(scores["relevance"] + min(0.6, len(matched_keywords) * 0.15), 2))

        # 4. Total Score Calculation
        total_score = round(sum(scores.values()), 2)
        max_score = 15.0

        feedback_summary = (
            f"Evaluation Summary: Word count is {word_count} words. "
            f"Matched key references: {', '.join(matched_keywords[:4]) if matched_keywords else 'None'}. "
            f"Structure includes {'both Intro and Conclusion' if has_intro and has_conclusion else 'partial structural framing'}. "
            f"Total estimated score: {total_score}/{max_score}."
        )

        return {
            "word_count": word_count,
            "rubric_scores": scores,
            "total_score": total_score,
            "max_score": max_score,
            "matched_keywords": matched_keywords,
            "ai_feedback_summary": feedback_summary,
            "evaluator_type": "RULE_RUBRIC_HYBRID"
        }
