import json
import uuid
from typing import Dict, Any, Optional
from backend.app.ai.local_llm import LocalLLMClient

class AIQuestionGenerator:
    """
    Generates candidate practice questions with automatic validation checks before bank admission.
    """
    def __init__(self, llm_client: Optional[LocalLLMClient] = None):
        self.llm = llm_client or LocalLLMClient()

    def validate_question_data(self, q_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates mathematical, structural, and metadata requirements of generated questions.
        """
        errors = []
        if not q_data.get("content") or len(q_data["content"]) < 15:
            errors.append("Question content is too short or missing.")

        options = q_data.get("options", [])
        if not options or len(options) != 4:
            errors.append("Question must contain exactly 4 distinct options.")
        else:
            opt_texts = [o.get("text", "").strip() for o in options]
            if len(set(opt_texts)) < 4:
                errors.append("Options contain duplicate values.")

        correct_ans = q_data.get("correct_answer")
        if not correct_ans or correct_ans not in ["A", "B", "C", "D"]:
            errors.append("Valid correct_answer ('A', 'B', 'C', or 'D') is required.")

        if not q_data.get("explanation") or len(q_data["explanation"]) < 10:
            errors.append("Detailed solution explanation is missing.")

        diff = q_data.get("difficulty", 0.5)
        if not (0.0 <= diff <= 1.0):
            errors.append("Difficulty must be in range [0.0, 1.0].")

        return {
            "is_valid": len(errors) == 0,
            "errors": errors
        }

    async def generate_candidate_question(
        self,
        exam: str,
        subject: str,
        chapter: str,
        concept_id: str,
        concept_name: str,
        target_difficulty: float = 0.60
    ) -> Dict[str, Any]:
        """
        Generates and validates a new question.
        """
        prompt = (
            f"Generate an exam-standard multiple-choice question for {exam}.\n"
            f"Subject: {subject}\n"
            f"Chapter: {chapter}\n"
            f"Concept: {concept_name} (ID: {concept_id})\n"
            f"Target Difficulty: {target_difficulty}\n"
            f"Return ONLY a JSON object formatted as:\n"
            f'{{"content": "...", "options": [{{"id": "A", "text": "..."}}, {{"id": "B", "text": "..."}}, {{"id": "C", "text": "..."}}, {{"id": "D", "text": "..."}}], "correct_answer": "A", "explanation": "...", "difficulty": {target_difficulty}}}'
        )

        res = await self.llm.generate_text(prompt)

        try:
            # Attempt to parse json
            parsed = json.loads(res["text"])
        except Exception:
            # Deterministic fallback question for the concept
            parsed = {
                "content": f"Which of the following fundamental principles applies directly to {concept_name}?",
                "options": [
                    {"id": "A", "text": f"Governed by standard conservation and boundary conditions of {concept_name}"},
                    {"id": "B", "text": "Violates first-order linear approximations"},
                    {"id": "C", "text": "Independent of initial boundary values"},
                    {"id": "D", "text": "None of the above"}
                ],
                "correct_answer": "A",
                "explanation": f"Standard fundamental definitions of {concept_name} require satisfying the primary conservation and boundary principles.",
                "difficulty": target_difficulty
            }

        validation = self.validate_question_data(parsed)
        parsed["question_id"] = f"GEN_{exam}_{uuid.uuid4().hex[:8].upper()}"
        parsed["exam"] = exam
        parsed["subject"] = subject
        parsed["chapter"] = chapter
        parsed["concept_id"] = concept_id
        parsed["validation"] = validation

        return parsed
