"""Gemini extractor: Google's hosted Generative Language API (free tier).

The right default for a hosted deployment — no local model to install.
Uses the REST endpoint via httpx (already a dependency), so switching to
Gemini adds no new package. API key comes from GEMINI_API_KEY in the
environment (never committed).
"""
import json
import os

import httpx

from ...config import GEMINI_MODEL, GEMINI_TIMEOUT_SECONDS
from .base import Extractor, ExtractorUnavailable, run_with_retry

ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


class GeminiExtractor(Extractor):
    def extract(self, subject: str, body: str) -> dict:
        return run_with_retry(self._complete, subject, body)

    def _complete(self, system: str, user: str) -> str:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ExtractorUnavailable(
                "GEMINI_API_KEY is not set (put it in the host environment or backend/.env)"
            )
        payload = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {
                "temperature": 0,
                # Server-side JSON forcing; our parsing stays defensive anyway.
                "responseMimeType": "application/json",
            },
        }
        try:
            response = httpx.post(
                ENDPOINT.format(model=GEMINI_MODEL),
                headers={"x-goog-api-key": api_key},  # key in header, not URL
                json=payload,
                timeout=GEMINI_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            # 400 bad model, 401/403 bad key, 429 quota — stop the run rather
            # than hammer a broken key; the message surfaces to the UI.
            detail = exc.response.text[:300]
            raise ExtractorUnavailable(
                f"Gemini API error {exc.response.status_code} "
                f"(model '{GEMINI_MODEL}'): {detail}"
            )
        except httpx.HTTPError as exc:
            raise ExtractorUnavailable(f"Cannot reach Gemini API: {exc}")

        data = response.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            # A single email blocked by a safety/recitation filter yields no
            # candidate. Return "" so the parse-failure path marks just this
            # record needs_review — never halt the whole sync for one email.
            return ""
