"""
Deterministic Slot-Filling Templates for AI Study Mentor
Platform Upgrade v3.0 — Offline-First, Zero-Hallucination
"""
from typing import Dict, Any, Optional

def format_mistake_analysis(ctx: Dict[str, Any]) -> str:
    exam = ctx.get("exam", "JEE")
    attempt_info = ctx.get("latest_attempt")
    if not attempt_info:
        return (
            "### 📊 Diagnostic Analysis Not Available Yet\n\n"
            "You have not completed a diagnostic assessment in this session yet. "
            "Please take the **9-Question Compulsory Screener** or a **Topic Drill** first "
            "so I can analyze your cognitive error patterns and time allocations!"
        )

    items = attempt_info.get("items", [])
    wrong_items = [it for it in items if not it.get("is_correct")]
    score = attempt_info.get("score_percentage", 0)

    lines = [
        f"### 📊 Diagnostic Post-Mortem ({exam} Mode)",
        f"- **Latest Score:** {score}% ({len(items) - len(wrong_items)} / {len(items)} correct)",
        f"- **Test Tier:** {attempt_info.get('test_tier', 'SCREENER')}",
        ""
    ]

    if not wrong_items:
        lines.append("🎉 **Flawless Diagnostic Performance!**")
        lines.append("You made 0 errors on this assessment. Latent ability theta is calibrated into high mastery. "
                     "I recommend moving immediately to **Full Syllabus Deep Scan** or high-difficulty multi-concept drills.")
        return "\n".join(lines)

    lines.append(f"**Identified Error Breakdown ({len(wrong_items)} Mistakes):**\n")
    for i, w in enumerate(wrong_items, 1):
        err = w.get("error_type", "CONCEPTUAL_GAP").replace("_", " ")
        q_id = w.get("question_id", "Q")
        ans = w.get("student_answer", "Skipped")
        correct = w.get("correct_answer", "-")
        time_spent = w.get("time_taken_seconds", 0)
        distractor = w.get("distractor_note")

        lines.append(f"**{i}. Question `{q_id}` — {err}**")
        lines.append(f"- Your Choice: `{ans}` | Correct Answer: `{correct}` | Time Spent: `{time_spent}s`")
        if distractor:
            lines.append(f"- 💡 *Cognitive Trap Identified:* {distractor}")
        lines.append("")

    lines.append("### 🎯 Immediate Prescription")
    lines.append("1. **Prerequisite Quarantine:** Isolate the concepts flagged above before attempting mixed mock tests.")
    lines.append("2. **Targeted Drill:** Use the **Topic Drill** button to practice 5 focused questions on your weakest subject.")
    lines.append("3. **Formula/NCERT Verification:** Review the exact derivations or NCERT line-by-line notes for the flagged concepts.")
    return "\n".join(lines)


def format_roadmap_explanation(ctx: Dict[str, Any]) -> str:
    exam = ctx.get("exam", "JEE")
    milestones = ctx.get("roadmap_milestones", [])

    lines = [
        f"### 🗺️ Why Your {exam} Roadmap is Sequenced This Way",
        ""
    ]

    if not milestones:
        lines.append("Your dynamic roadmap will be automatically generated as soon as you submit your diagnostic assessment!")
        return "\n".join(lines)

    lines.append("Our **Dynamic DAG Priority Engine** orders each milestone based on 4 mathematical weights:\n"
                 "1. **Prerequisite Topology:** Foundational concepts (mechanics/calculus/cell biology) must be repaired first.\n"
                 "2. **Exam Yield:** High-weighting chapters for your target exam are front-loaded.\n"
                 "3. **Knowledge Tracing (BKT/IRT):** Weakest latent abilities receive highest repair urgency.\n"
                 "4. **Forgetting Decay:** Spaced repetition protects against memory drop-off.\n")

    lines.append("**Your Next Priority Actions:**")
    for m in milestones[:4]:
        step = m.get("order", 1)
        title = m.get("title", "Action")
        atype = m.get("action_type", "").replace("_", " ")
        reason = m.get("reason", "")
        mins = m.get("estimated_minutes", 45)
        lines.append(f"- **Step {step}: {title}** ({mins} mins)")
        lines.append(f"  *Type:* `{atype}` | *Why:* {reason}")

    lines.append("\n💡 *Every time you complete a quiz or drill, the DAG recalculates priorities automatically.*")
    return "\n".join(lines)


def format_strategy_tips(exam: str, ctx: Dict[str, Any]) -> str:
    if exam == "NEET":
        return (
            "### 🎯 NEET-UG Speed & Accuracy Strategy\n\n"
            "**Target: 680+ / 720 (99.5th Percentile Strategy)**\n\n"
            "1. **Biology NCERT Velocity (50% of Paper):**\n"
            "   - Target: 90 Questions in 40–45 minutes max.\n"
            "   - Direct line-by-line NCERT memory recall; zero overthinking.\n\n"
            "2. **Chemistry First-Pass Method:**\n"
            "   - Inorganic & Organic: Direct factual recall in 15–20 minutes.\n"
            "   - Physical Chemistry calculations: 20–25 minutes.\n\n"
            "3. **Physics Tactical Problem Selection:**\n"
            "   - Reserve 50–55 minutes for Physics.\n"
            "   - Do direct formula substitutions first; skip heavy multi-step mechanics questions on Pass 1.\n\n"
            "4. **Negative Marking Defense:**\n"
            "   - Never guess when confidence is under 50%. A +4 to -1 swing (-5 total) destroys rank in NEET."
        )
    else:  # JEE
        return (
            "### ⚡ JEE Main Speed & Accuracy Tactics\n\n"
            "**Target: 99+ Percentile (200+ Score Strategy)**\n\n"
            "1. **The 3-Pass Exam Method:**\n"
            "   - **Pass 1 (0–60 mins):** Solve all 1-minute direct questions across Chemistry, Physics, and Math.\n"
            "   - **Pass 2 (60–140 mins):** High-confidence numericals and standard 2-step calculus/mechanics problems.\n"
            "   - **Pass 3 (140–180 mins):** Complex multi-concept calculations and verification.\n\n"
            "2. **Section B (Numerical Value Questions):**\n"
            "   - Choose the 5 easiest out of 10 options. Pick direct formula questions with round numbers.\n\n"
            "3. **Mathematics Time Budgeting:**\n"
            "   - Allocate at least 65–70 minutes for Mathematics. Modern JEE Main Math is deliberately lengthy.\n\n"
            "4. **Negative Marking Discipline:**\n"
            "   - If two options cannot be eliminated deterministically, leave the question unattempted."
        )


def format_concept_explanation(topic_hint: Optional[str], exam: str) -> str:
    if not topic_hint:
        return (
            "### 📖 Concept Explanation Center\n\n"
            "I can explain any concept across Physics, Chemistry, and Mathematics (for JEE) or Biology (for NEET)!\n\n"
            "Try asking about:\n"
            "- *'Explain SHM and damped oscillations'*\n"
            "- *'Explain Henderson-Hasselbalch buffer equation'*\n"
            "- *'Explain L'Hopital's rule for limits'*\n"
            "- *'Explain Mendel's law of independent assortment'*"
        )

    th = topic_hint.lower()
    if "shm" in th or "oscillation" in th:
        return (
            "### 🔬 Concept: Simple Harmonic Motion (SHM)\n\n"
            "- **Governing Equation:** $F = -kx \\implies \\frac{d^2x}{dt^2} + \\omega^2 x = 0$\n"
            "- **Angular Frequency:** $\\omega = \\sqrt{\\frac{k}{m}} = \\frac{2\\pi}{T}$\n"
            "- **Energy Conservation:** $E_{total} = \\frac{1}{2}kA^2 = K(t) + U(t)$\n"
            "- **Exam Trap:** At equilibrium ($x=0$), velocity and kinetic energy are maximal, while acceleration is ZERO."
        )
    elif "buffer" in th or "ionic" in th:
        return (
            "### 🔬 Concept: Acidic & Basic Buffers\n\n"
            "- **Acidic Buffer:** Weak Acid (HA) + Conjugate Base Salt (NaA)\n"
            "- **Henderson-Hasselbalch Equation:** $\\text{pH} = \\text{pK}_a + \\log\\frac{[\\text{Conjugate Base}]}{[\\text{Weak Acid}]}$\n"
            "- **Buffer Capacity:** Maximum when $[\text{Salt}] = [\text{Acid}] \\implies \\text{pH} = \\text{pK}_a$.\n"
            "- **Exam Trap:** Dilution changes concentration but DOES NOT change the ratio $\\frac{[\\text{Salt}]}{[\\text{Acid}]}$, so pH remains constant!"
        )
    elif "limit" in th or "calculus" in th:
        return (
            "### 🔬 Concept: Calculus Limits & L'Hôpital's Rule\n\n"
            "- **Applicability:** Applies ONLY to indeterminate forms $\\frac{0}{0}$ or $\\frac{\\infty}{\\infty}$.\n"
            "- **Method:** $\\lim_{x \\to a} \\frac{f(x)}{g(x)} = \\lim_{x \\to a} \\frac{f'(x)}{g'(x)}$\n"
            "- **Standard Limit Expansion:** $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$, $\\lim_{x \\to 0} \\frac{e^x - 1}{x} = 1$, $\\lim_{x \\to 0} \\frac{\\ln(1+x)}{x} = 1$.\n"
            "- **Exam Trap:** Do NOT apply quotient rule $(\\frac{u}{v})'$ when applying L'Hôpital — differentiate numerator and denominator independently!"
        )
    elif "cell" in th or "genetic" in th:
        return (
            "### 🔬 Concept: Cell Biology & Chromosomal Division\n\n"
            "- **Meiosis I vs II:** Homologous chromosomes segregate during Anaphase I (reductional division). Sister chromatids segregate during Anaphase II (equational division).\n"
            "- **Crossing Over:** Occurs in **Pachytene** stage of Prophase I, mediated by enzyme recombinase.\n"
            "- **Synaptonemal Complex:** Formed during **Zygotene** stage.\n"
            "- **Exam Trap:** In Anaphase I, centromeres DO NOT split; splitting occurs strictly in Anaphase II."
        )
    else:
        return (
            f"### 🔬 Concept: {topic_hint.title()}\n\n"
            f"For {exam}, focus on the fundamental formulas and prerequisite relationships. "
            "Make sure to practice numerical applications and review distractor options in PYQs."
        )


def format_unknown_fallback(exam: str) -> str:
    return (
        f"### 🤖 AI Study Mentor ({exam} Mode)\n\n"
        "I am trained specifically to help you master your exam preparation through your diagnostic test data and study roadmap. "
        "Here are the most powerful queries you can ask right now:\n\n"
        "- 📊 **Analyze My Mistakes:** Post-mortem of your latest quiz errors with distractor diagnosis.\n"
        "- 🗺️ **Explain My Roadmap:** Understand why your upcoming milestones are ordered the way they are.\n"
        "- ⚡ **Speed & Accuracy Tips:** Tactical blueprints to minimize negative marking and maximize score.\n"
        "- 🔬 **Explain [Concept Name]:** Crisp conceptual definitions and high-yield problem solving rules.\n\n"
        "*Tip: Click any of the quick prompt chips above the input box!*"
    )
