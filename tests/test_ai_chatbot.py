import pytest
from backend.app.ai.intent_classifier import (
    IntentClassifier,
    INTENT_ANALYZE_MISTAKES,
    INTENT_EXPLAIN_ROADMAP,
    INTENT_STRATEGY_TIPS,
    INTENT_EXPLAIN_CONCEPT,
    INTENT_UNKNOWN
)
from backend.app.ai.local_llm import LocalLLMClient

def test_intent_classification_exact_and_fuzzy():
    # Mistake analysis
    intent, conf, _ = IntentClassifier.classify("Why did I get question 3 wrong?")
    assert intent == INTENT_ANALYZE_MISTAKES
    assert conf >= 0.80

    # Roadmap explanation
    intent, conf, _ = IntentClassifier.classify("Explain my study roadmap and next steps")
    assert intent == INTENT_EXPLAIN_ROADMAP
    assert conf >= 0.80

    # Strategy tips
    intent, conf, _ = IntentClassifier.classify("Give me speed and accuracy tips for JEE")
    assert intent == INTENT_STRATEGY_TIPS
    assert conf >= 0.80

    # Concept explanation
    intent, conf, hint = IntentClassifier.classify("Explain SHM oscillation formulas")
    assert intent == INTENT_EXPLAIN_CONCEPT
    assert hint == "shm"

    # Fuzzy typo matching
    intent, conf, _ = IntentClassifier.classify("analze my mistaks")
    assert intent == INTENT_ANALYZE_MISTAKES
    assert conf >= 0.70

    # Unknown / gibberish
    intent, conf, _ = IntentClassifier.classify("blargh xyz random string")
    assert intent == INTENT_UNKNOWN
    assert conf == 0.0

@pytest.mark.asyncio
async def test_deterministic_llm_generation():
    client = LocalLLMClient()
    dummy_ctx = {
        "exam": "JEE",
        "latest_attempt": {
            "score_percentage": 50.0,
            "test_tier": "SCREENER",
            "items": [
                {
                    "question_id": "JEE_PHY_MEC_001",
                    "is_correct": False,
                    "student_answer": "B",
                    "correct_answer": "A",
                    "error_type": "CALCULATION_SLIP",
                    "time_taken_seconds": 45,
                    "distractor_note": "Forgot to square the velocity"
                }
            ]
        },
        "roadmap_milestones": [
            {
                "order": 1,
                "title": "Kinematics Foundation",
                "action_type": "JEE_FOUNDATION_REBUILD",
                "reason": "Prerequisite chain repair",
                "estimated_minutes": 45
            }
        ]
    }

    # Test mistake query
    res = await client.generate_text("Analyze my quiz mistakes", student_context=dummy_ctx)
    assert res["intent"] == INTENT_ANALYZE_MISTAKES
    assert "JEE_PHY_MEC_001" in res["text"]
    assert "CALCULATION SLIP" in res["text"]
    assert "Forgot to square the velocity" in res["text"]

    # Test roadmap query
    res_rm = await client.generate_text("Explain my roadmap", student_context=dummy_ctx)
    assert res_rm["intent"] == INTENT_EXPLAIN_ROADMAP
    assert "Kinematics Foundation" in res_rm["text"]

    # Test strategy query
    res_strat = await client.generate_text("Speed and accuracy tips", student_context=dummy_ctx)
    assert res_strat["intent"] == INTENT_STRATEGY_TIPS
    assert "JEE" in res_strat["text"]
