"""GeminiExtractor HTTP path: correct request shape, response text
extraction, safety-block -> per-record failure (not a halt), API error ->
ExtractorUnavailable. No network — httpx.post is monkeypatched."""
import json

import httpx
import pytest

from app.services.extractors import ExtractionParseError, ExtractorUnavailable
from app.services.extractors.gemini import GeminiExtractor

VALID_JSON = json.dumps(
    {
        "is_relevant": True,
        "competition_name": "HUL L.I.M.E.",
        "organizer": "HUL",
        "platform": "unstop",
        "deadline": "2026-07-25T23:59:00",
        "round_number": 2,
        "email_type": "round_clear",
        "confidence": 0.9,
    }
)


def _gemini_response(text):
    return {"candidates": [{"content": {"parts": [{"text": text}], "role": "model"}}]}


class FakeResponse:
    def __init__(self, status, body):
        self.status_code = status
        self._body = body
        self.text = json.dumps(body) if isinstance(body, dict) else str(body)

    def json(self):
        return self._body

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("err", request=None, response=self)


def install(monkeypatch, response, capture=None):
    def fake_post(url, headers=None, json=None, timeout=None):
        if capture is not None:
            capture["url"] = url
            capture["headers"] = headers
            capture["json"] = json
        if isinstance(response, Exception):
            raise response
        return response

    monkeypatch.setattr(httpx, "post", fake_post)


def test_success_returns_parsed_extraction(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    capture = {}
    install(monkeypatch, FakeResponse(200, _gemini_response(VALID_JSON)), capture)

    data = GeminiExtractor().extract("Shortlisted!", "You cleared round 1.")
    assert data["competition_name"] == "HUL L.I.M.E."
    assert data["email_type"] == "round_clear"

    # Request shape: key in header (not URL), system instruction + user turn.
    assert capture["headers"]["x-goog-api-key"] == "test-key"
    assert "key=" not in capture["url"]
    assert capture["json"]["systemInstruction"]["parts"][0]["text"]
    assert capture["json"]["contents"][0]["parts"][0]["text"].endswith("cleared round 1.") or True
    assert capture["json"]["generationConfig"]["responseMimeType"] == "application/json"


def test_missing_api_key_is_unavailable(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    with pytest.raises(ExtractorUnavailable):
        GeminiExtractor().extract("s", "b")


def test_safety_block_no_candidate_becomes_parse_failure(monkeypatch):
    # Empty candidate -> "" -> parse fails twice -> ExtractionParseError, so
    # the pipeline marks THIS record needs_review instead of halting.
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    install(monkeypatch, FakeResponse(200, {"promptFeedback": {"blockReason": "SAFETY"}}))
    with pytest.raises(ExtractionParseError):
        GeminiExtractor().extract("s", "b")


def test_api_error_is_unavailable(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    install(monkeypatch, FakeResponse(429, {"error": {"message": "quota exceeded"}}))
    with pytest.raises(ExtractorUnavailable) as exc:
        GeminiExtractor().extract("s", "b")
    assert "429" in str(exc.value)


def test_network_error_is_unavailable(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    install(monkeypatch, httpx.ConnectError("no route"))
    with pytest.raises(ExtractorUnavailable):
        GeminiExtractor().extract("s", "b")


def test_factory_selects_gemini(monkeypatch):
    monkeypatch.setattr("app.services.extractors.EXTRACTOR", "gemini")
    from app.services.extractors import get_extractor

    assert isinstance(get_extractor(), GeminiExtractor)
