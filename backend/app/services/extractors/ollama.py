"""Default extractor: local Ollama instance, zero paid services."""
import httpx

from ...config import OLLAMA_MODEL, OLLAMA_TIMEOUT_SECONDS, OLLAMA_URL
from .base import Extractor, ExtractorUnavailable, run_with_retry


class OllamaExtractor(Extractor):
    def extract(self, subject: str, body: str) -> dict:
        return run_with_retry(self._complete, subject, body)

    def _complete(self, system: str, user: str) -> str:
        payload = {
            "model": OLLAMA_MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "stream": False,
            # Ollama-side JSON forcing; parsing stays defensive regardless.
            "format": "json",
            "options": {"temperature": 0},
        }
        try:
            response = httpx.post(
                f"{OLLAMA_URL}/api/chat", json=payload, timeout=OLLAMA_TIMEOUT_SECONDS
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise ExtractorUnavailable(
                f"Ollama not reachable at {OLLAMA_URL} (model '{OLLAMA_MODEL}'): {exc}"
            )
        return response.json().get("message", {}).get("content", "")
