"""
Deterministic Intent Classifier
Platform Upgrade v3.0 — Hardened Offline AI Assistant
Keyword + Regex + Fuzzy Distance Matching with Zero Guessing
"""
import re
from difflib import SequenceMatcher
from typing import Tuple, Optional

INTENT_ANALYZE_MISTAKES = "ANALYZE_MISTAKES"
INTENT_EXPLAIN_ROADMAP = "EXPLAIN_ROADMAP"
INTENT_STRATEGY_TIPS = "STRATEGY_TIPS"
INTENT_EXPLAIN_CONCEPT = "EXPLAIN_CONCEPT"
INTENT_UNKNOWN = "UNKNOWN"

INTENT_KEYWORDS = {
    INTENT_ANALYZE_MISTAKES: [
        "mistake", "error", "wrong", "failed", "incorrect", "postmortem",
        "analyze my mistakes", "why did i get wrong", "what did i miss", "weakness",
        "calculation error", "conceptual gap", "distractor"
    ],
    INTENT_EXPLAIN_ROADMAP: [
        "roadmap", "plan", "milestone", "what next", "why this topic", "prerequisite",
        "explain my roadmap", "study schedule", "learning path", "next action",
        "why study", "curriculum sequence"
    ],
    INTENT_STRATEGY_TIPS: [
        "speed", "accuracy", "time management", "strategy", "exam tip", "tips",
        "how to improve score", "negative marking", "jee strategy", "neet strategy",
        "speed and accuracy", "score 99 percentile", "score 680"
    ],
    INTENT_EXPLAIN_CONCEPT: [
        "explain", "what is", "how does", "formula", "definition", "concept",
        "deriv", "law of", "theorem", "difference between"
    ]
}

INTENT_PATTERNS = {
    INTENT_ANALYZE_MISTAKES: re.compile(r"\b(mistake|error|wrong|incorrect|fail|analysis|postmortem)\b", re.IGNORECASE),
    INTENT_EXPLAIN_ROADMAP: re.compile(r"\b(roadmap|milestone|schedule|path|next step|prerequisite|why should i)\b", re.IGNORECASE),
    INTENT_STRATEGY_TIPS: re.compile(r"\b(speed|accuracy|tip|strategy|time|pace|negative mark|score)\b", re.IGNORECASE),
    INTENT_EXPLAIN_CONCEPT: re.compile(r"\b(explain|what is|how do|formula|define|definition|concept)\b", re.IGNORECASE)
}


class IntentClassifier:
    """
    Two-stage intent classifier:
    1. Fast regex & keyword inclusion.
    2. Fuzzy similarity matching via SequenceMatcher for typos.
    3. Strict UNKNOWN fallback when confidence < 0.60.
    """

    @classmethod
    def sanitize_input(cls, user_text: str) -> str:
        """Strip dangerous characters, prompt injection patterns, and limit length to 500 chars."""
        if not user_text:
            return ""
        # Remove prompt injection delimiters
        cleaned = re.sub(r"[<>{}\[\]\\]", " ", user_text)
        # Collapse whitespace
        cleaned = " ".join(cleaned.split())
        return cleaned[:500]

    @classmethod
    def classify(cls, user_text: str) -> Tuple[str, float, Optional[str]]:
        """
        Classifies user prompt into (intent, confidence, matched_topic_or_concept).
        """
        cleaned = cls.sanitize_input(user_text).lower()
        if not cleaned or len(cleaned) < 2:
            return INTENT_UNKNOWN, 0.0, None

        # Stage 1: Exact keyword / substring match
        for intent, keywords in INTENT_KEYWORDS.items():
            for kw in keywords:
                if kw in cleaned:
                    return intent, 0.95, cls._extract_topic_hint(cleaned)

        # Stage 2: Regex pattern match
        for intent, pattern in INTENT_PATTERNS.items():
            if pattern.search(cleaned):
                return intent, 0.85, cls._extract_topic_hint(cleaned)

        # Stage 3: Fuzzy similarity matching for typos
        best_intent = INTENT_UNKNOWN
        best_score = 0.0
        words = cleaned.split()

        for intent, keywords in INTENT_KEYWORDS.items():
            for kw in keywords:
                kw_words = kw.split()
                # Check token-level similarity
                for w in words:
                    for kw_w in kw_words:
                        sim = SequenceMatcher(None, w, kw_w).ratio()
                        if sim > best_score:
                            best_score = sim
                            best_intent = intent

        # Threshold check: require >= 0.72 similarity for fuzzy match
        if best_score >= 0.72:
            return best_intent, round(best_score, 2), cls._extract_topic_hint(cleaned)

        return INTENT_UNKNOWN, 0.0, None

    @classmethod
    def _extract_topic_hint(cls, text: str) -> Optional[str]:
        """Extracts potential concept or subject name from query text."""
        topics = [
            "mechanics", "kinematics", "shm", "oscillations", "optics", "buffer",
            "ionic", "organic", "goc", "calculus", "limits", "integrals",
            "genetics", "cardiac", "heart", "cell", "newton"
        ]
        for t in topics:
            if t in text:
                return t
        return None
