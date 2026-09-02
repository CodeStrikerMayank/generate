import os
import json
import httpx
from typing import Dict, Any, Optional

class LocalLLMClient:
    """
    Offline Local LLM client connecting to Ollama or local inference server.
    Ensures safe graceful fallback to rule-based generation when offline/disabled.
    Grounded directly in the student's recent diagnostic quiz and dynamic roadmap.
    """
    def __init__(
        self,
        base_url: Optional[str] = None,
        model_name: Optional[str] = None,
        enabled: Optional[bool] = None
    ):
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model_name = model_name or os.getenv("OLLAMA_MODEL", "llama3:latest")
        self.enabled = enabled if enabled is not None else os.getenv("LOCAL_AI_ENABLED", "true").lower() == "true"

    async def generate_text(
        self,
        prompt: str,
        system_prompt: str = "",
        student_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Sends generation request to local Ollama instance with fallback.
        """
        if not self.enabled:
            return {
                "text": "Local AI assistant is currently disabled in configuration.",
                "source": "DISABLED"
            }

        # Build context prompt for LLM if present
        augmented_prompt = prompt
        if student_context:
            ctx_summary = self._serialize_student_context(student_context)
            augmented_prompt = f"--- STUDENT QUIZ & ROADMAP STATE ---\n{ctx_summary}\n--- STUDENT QUERY ---\n{prompt}"

        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model_name,
            "prompt": augmented_prompt,
            "system": system_prompt,
            "stream": False
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "text": data.get("response", "").strip(),
                        "source": f"OLLAMA_{self.model_name}"
                    }
        except Exception:
            # Graceful fallback if Ollama server is not running
            pass

        return {
            "text": self._rule_based_fallback_explanation(prompt, student_context),
            "source": "RULE_BASED_STUDENT_INTELLIGENCE"
        }

    def _serialize_student_context(self, ctx: Dict[str, Any]) -> str:
        lines = []
        exam = ctx.get("target_exam", "JEE")
        lines.append(f"Target Exam: {exam}")
        lines.append(f"Overall Mastery: {ctx.get('overall_mastery', 0)}%")
        lines.append(f"IRT Latent Ability (theta): {ctx.get('latent_ability_theta', 0.0)}")

        quiz = ctx.get("latest_quiz")
        if quiz:
            lines.append(f"Latest Quiz Score: {quiz.get('score_percentage', 0)}% ({quiz.get('correct_count')}/{quiz.get('total_questions')} correct)")
            lines.append(f"Mistakes Count: {len(quiz.get('mistakes', []))}")
            for m in quiz.get("mistakes", []):
                lines.append(f" - Missed {m.get('subject')}: {m.get('concept_id')}. Student chose '{m.get('student_answer')}', correct was '{m.get('correct_answer')}'. Diagnostic: {m.get('distractor_note') or m.get('error_type')}")

        actions = ctx.get("roadmap_actions")
        if actions:
            lines.append("Current Roadmap Plan:")
            for a in actions:
                lines.append(f" - Priority {a.get('order')}: {a.get('concept_id')} ({a.get('action_type')}) -> {a.get('reasons', [''])[0]}")

        return "\n".join(lines)

    def _rule_based_fallback_explanation(self, prompt: str, ctx: Optional[Dict[str, Any]] = None) -> str:
        """
        Deterministic, offline intelligence engine specifically analyzing the student's quiz and roadmap.
        """
        p_lower = prompt.lower()
        exam = (ctx.get("target_exam") if ctx else "JEE") or "JEE"
        quiz = (ctx.get("latest_quiz") if ctx else None)
        actions = (ctx.get("roadmap_actions") if ctx else None)
        mistakes = quiz.get("mistakes", []) if quiz else []

        # 1. QUIZ MISTAKES & ERROR DIAGNOSTICS
        if any(w in p_lower for w in ["mistake", "error", "quiz", "wrong", "score", "attempt", "gap", "fail"]):
            if not quiz:
                return (
                    f"👋 Welcome to {exam} preparation! You haven't submitted a diagnostic assessment yet.\n\n"
                    f"👉 Please take the compulsory diagnostic test from the **Assessment** tab so I can extract your latent ability (θ), "
                    f"identify specific conceptual/calculation gaps, and construct your personalized {exam} roadmap."
                )

            score = quiz.get("score_percentage", 0)
            correct = quiz.get("correct_count", 0)
            total = quiz.get("total_questions", 0)
            theta = ctx.get("latent_ability_theta", 0.0)

            resp_lines = [
                f"📊 **Post-Mortem: Your {exam} Diagnostic Assessment**\n",
                f"• **Score:** {score}% ({correct}/{total} correct) | **Time:** {quiz.get('time_taken_seconds', 0)}s",
                f"• **Latent Ability (θ):** {theta:+0.2f} (Item Response Theory calibration)",
            ]

            sb = quiz.get("subject_breakdown", {})
            if sb:
                sub_parts = []
                for sub, data in sb.items():
                    pct = int((data["correct"] / max(data["total"], 1)) * 100)
                    sub_parts.append(f"{sub}: {data['correct']}/{data['total']} ({pct}%)")
                resp_lines.append(f"• **Subject Accuracy:** " + " • ".join(sub_parts))

            resp_lines.append("")

            if mistakes:
                resp_lines.append("⚠️ **Detailed Breakdown of Missed Questions:**")
                for i, m in enumerate(mistakes, 1):
                    distractor = f"\n   ↳ *Diagnostic:* {m['distractor_note']}" if m.get("distractor_note") else ""
                    resp_lines.append(
                        f"**{i}. {m['subject']} — Concept:** `{m['concept_id']}`\n"
                        f"   • Your Answer: **Option {m['student_answer'] or 'Skipped'}** | Correct: **Option {m['correct_answer']}**\n"
                        f"   • Error Pattern: `{m.get('error_type', 'CONCEPTUAL_ERROR').replace('_', ' ')}`{distractor}\n"
                        f"   • Solution Derivation: {m.get('explanation', '')}\n"
                    )
            else:
                resp_lines.append("🎉 **Perfect Run!** You didn't make any errors in this assessment. All tested concepts are at high mastery.\n")

            if exam == "JEE":
                resp_lines.append(
                    "💡 **JEE Tactical Insight:** In JEE Main, avoiding negative marks (-1 penalty) on these exact calculation/formula slips "
                    "protects 20-30 percentile points. We will focus on step-by-step mathematical verification."
                )
            else:
                resp_lines.append(
                    "💡 **NEET Tactical Insight:** In NEET-UG, each unforced error costs 5 marks (+4 missed, -1 penalty). "
                    "Ensure you re-verify NCERT biological keywords and double-check unit conversions in Physics."
                )

            return "\n".join(resp_lines)

        # 2. ROADMAP & STUDY SEQUENCE
        if any(w in p_lower for w in ["roadmap", "priority", "next", "study", "plan", "sequence", "action", "unlock"]):
            if not actions:
                return (
                    f"🗺️ **{exam} Dynamic Roadmap:**\n"
                    f"Complete the diagnostic test first to generate your custom-calibrated learning sequence!"
                )

            resp_lines = [
                f"🗺️ **Your Personalized {exam} Dynamic Roadmap Breakdown**\n",
                f"Based on your diagnostic assessment and knowledge graph dependencies, the engine sequenced the following actions:\n"
            ]

            for a in actions:
                reasons_str = " • ".join(a.get("reasons", [])[:2])
                resp_lines.append(
                    f"**Step {a['order']} [{a['action_type']}]: `{a['concept_id']}`**\n"
                    f"• **Priority:** {int(a['priority_score'] * 100)}% | **Est. Time:** ~{a['estimated_minutes']} mins ({a['target_questions']} questions)\n"
                    f"• **Why this step:** {reasons_str}\n"
                )

            resp_lines.append(
                f"🔍 **Engine Architecture Rationale:**\n"
                f"The roadmap strictly enforces the prerequisite graph. Foundational concepts that you struggled with in the diagnostic quiz "
                f"are placed at the very front. Once you achieve >= 70% mastery in Step 1, the downstream {exam} advanced problem tiers will automatically unlock!"
            )
            return "\n".join(resp_lines)

        # 3. EXAM STRATEGY, SPEED, AND IMPROVEMENT
        if any(w in p_lower for w in ["improve", "tip", "speed", "accuracy", "strategy", "score", "prep", "guidance"]):
            if exam == "JEE":
                return (
                    "🎯 **JEE Main & Advanced High-Impact Strategy Blueprint:**\n\n"
                    "1. **Foundational Pre-requisites First:** JEE never tests isolated concepts; questions synthesize Calculus with Kinematics or Equilibrium with Thermodynamics. Master root formulas first.\n"
                    "2. **Three-Pass Exam Protocol:**\n"
                    "   • Round 1 (0-45m): Speed scan — solve all direct single-concept questions in Chemistry and Physics.\n"
                    "   • Round 2 (45-120m): Multi-step calculus and coordinate geometry problems.\n"
                    "   • Round 3 (120-180m): Tough numerical questions with zero guessing.\n"
                    "3. **Zero Negative Marks Rule:** Never guess in single-choice questions with -1 penalty. Your diagnostic quiz indicated where calculation slips occurred — practice conscious double-checks on signs and algebraic expansions."
                )
            else:
                return (
                    "🎯 **NEET-UG 720/720 Precision & Speed Blueprint:**\n\n"
                    "1. **Biology 360 Anchor (40-45 Mins):** Biology carries 50% of total NEET marks. Target answering 90 questions in under 45 minutes with 95%+ accuracy through line-by-line NCERT familiarity.\n"
                    "2. **Chemistry Time-Saving (45-50 Mins):** Physical chemistry numericals are direct; Organic and Inorganic require instantaneous recall. Don't second-guess memory facts.\n"
                    "3. **Physics Calm Execution (60-70 Mins):** Most NEET physics questions are single-formula substitutions (e.g. Prism formula, Work integral, photoelectric effect). Isolate the knowns, select the formula, and verify units.\n"
                    "4. **Diagnostic Feedback:** Check your quiz post-mortem above to repair specific terminology confusion."
                )

        # 4. GENERAL CONCEPT HELP & DEFAULT
        quiz_status = f"Your latest diagnostic score is {quiz.get('score_percentage', 0)}%." if quiz else "Take the diagnostic test to benchmark your skills."
        return (
            f"🤖 **Offline AI Study Mentor ({exam})**\n\n"
            f"{quiz_status}\n\n"
            f"Here are questions you can ask me right now:\n"
            f"• *'Analyze my quiz mistakes'* — I will review the exact questions you got wrong and explain the derivations.\n"
            f"• *'Explain my roadmap sequence'* — I will show you why Step 1 is prioritized and how it unlocks your target chapters.\n"
            f"• *'Give me {exam} speed & accuracy tips'* — I will give you a strategic section-by-section breakdown.\n"
            f"• Or ask any concept question (e.g., *'Explain Ionic Buffer pH'* or *'What is Prism Minimum Deviation?'*)."
        )
