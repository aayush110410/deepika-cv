"""OpenRouter extractor: OpenAI-compatible chat completions endpoint.

Useful when a direct provider key is out of quota. Defaults to a free model
variant, but the model is just an env var so it can be swapped without code.
"""
import os

import httpx

from ...config import OPENROUTER_MODEL, OPENROUTER_TIMEOUT_SECONDS
from .base import Extractor, ExtractorUnavailable, run_with_retry

ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"


class OpenRouterExtractor(Extractor):
    def extract(self, subject: str, body: str) -> dict:
        return run_with_retry(self._complete, subject, body)

    def _complete(self, system: str, user: str) -> str:
        api_key = os.environ.get("OPENROUTER_API_KEY")
        if not api_key:
            raise ExtractorUnavailable(
                "OPENROUTER_API_KEY is not set (put it in the host environment or backend/.env)"
            )
        payload = {
            "model": OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0,
            "response_format": {"type": "json_object"},
        }
        try:
            response = httpx.post(
                ENDPOINT,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://deepika-cv.onrender.com",
                    "X-Title": "CaseTrack",
                },
                json=payload,
                timeout=OPENROUTER_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text[:300]
            raise ExtractorUnavailable(
                f"OpenRouter API error {exc.response.status_code} "
                f"(model '{OPENROUTER_MODEL}'): {detail}"
            )
        except httpx.HTTPError as exc:
            raise ExtractorUnavailable(f"Cannot reach OpenRouter API: {exc}")

        data = response.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError):
            return ""
