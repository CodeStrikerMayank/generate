from typing import Dict, Any, List
from backend.app.ai.local_llm import LocalLLMClient

class ExplanationGenerator:
    """
    Transforms structured student model states, error logs, and priority scores
    into actionable natural language study briefings and post-mortems.
    """
    def __init__(self, llm_client: LocalLLMClient):
        self.llm = llm_client

    async def explain_roadmap_priority(
        self,
        concept_name: str,
        mastery: float,
        priority_score: float,
        reasons: List[str],
        broken_prereqs: List[str]
    ) -> Dict[str, Any]:
        """
        Explains to the student WHY a particular concept has received its priority ranking.
        """
        structured_context = (
            f"Concept: {concept_name}\n"
            f"Mastery: {int(mastery * 100)}%\n"
            f"Priority Score: {priority_score}\n"
            f"Engine Reasons: {'; '.join(reasons)}\n"
            f"Broken Prerequisites: {', '.join(broken_prereqs) if broken_prereqs else 'None'}\n"
        )

        prompt = (
            f"Based on the following student intelligence data:\n{structured_context}\n"
            f"Provide a concise, encouraging 2-sentence study briefing explaining why this topic is the top priority "
            f"and what specific foundational focus is needed."
        )

        res = await self.llm.generate_text(prompt)
        return {
            "explanation": res["text"],
            "source": res["source"]
        }

    async def explain_error_postmortem(
        self,
        question_content: str,
        student_answer: str,
        correct_answer: str,
        explanation: str,
        error_type: str
    ) -> Dict[str, Any]:
        """
        Creates an actionable breakdown of a student's mistake.
        """
        prompt = (
            f"Question: {question_content}\n"
            f"Student Answer: {student_answer}\n"
            f"Correct Answer: {correct_answer}\n"
            f"Identified Error Type: {error_type}\n"
            f"Standard Solution: {explanation}\n"
            f"Explain clearly why the student's selected option was wrong and the exact conceptual pivot needed."
        )

        res = await self.llm.generate_text(prompt)
        return {
            "postmortem": res["text"],
            "source": res["source"]
        }
