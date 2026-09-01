import os
import json
import httpx
from typing import Dict, Any, Optional

class LocalLLMClient:
    """
    Offline Local LLM client connecting to Ollama or local inference server.
    Ensures safe graceful fallback to rule-based generation when offline/disabled.
    Never determines or overrides student mastery scores directly.
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

    async def generate_text(self, prompt: str, system_prompt: str = "") -> Dict[str, Any]:
        """
        Sends generation request to local Ollama instance with fallback.
        """
        if not self.enabled:
            return {
                "text": "Local AI assistant is currently disabled in configuration.",
                "source": "DISABLED"
            }

        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model_name,
            "prompt": prompt,
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
            "text": self._rule_based_fallback_explanation(prompt),
            "source": "RULE_BASED_FALLBACK"
        }

    def _rule_based_fallback_explanation(self, prompt: str) -> str:
        """
        Deterministic, offline rule-based fallback response when local LLM server is unavailable.
        """
        if "roadmap" in prompt.lower() or "priority" in prompt.lower():
            return (
                "Personalized Roadmap Summary:\n"
                "• Your immediate study actions are prioritized based on active knowledge gaps and prerequisite dependencies.\n"
                "• Step 1 targets foundational concept remediation before advancing to complex multi-step problems.\n"
                "• Review identified prerequisites and complete the recommended practice questions to recalibrate your mastery."
            )
        elif "mistake" in prompt.lower() or "error" in prompt.lower():
            return (
                "Error Post-Mortem Analysis:\n"
                "• Conceptual gaps occur when core definitions or formulas are misapplied.\n"
                "• Review the concept explanation, isolate the formula conditions, and re-attempt a transfer question."
            )
        else:
            return (
                "Offline Study Assistant:\n"
                "Focus on understanding the underlying physical/mathematical/constitutional principles. "
                "Ensure you complete the scheduled practice sessions to strengthen retention against forgetting decay."
            )
