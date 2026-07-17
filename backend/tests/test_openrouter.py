"""OpenRouter extractor HTTP path. No network: httpx.post is monkeypatched."""
import json

import httpx
import pytest

from app.services.extractors import ExtractorUnavailable
from app.services.extractors.openrouter import OpenRouterExtractor

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


def _openrouter_response(text):
    return {"choices": [{"message": {"content": text}}]}


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
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    monkeypatch.setenv("OPENROUTER_MODEL", "openai/gpt-oss-20b:free")
    capture = {}
    install(monkeypatch, FakeResponse(200, _openrouter_response(VALID_JSON)), capture)

    data = OpenRouterExtractor().extract("Shortlisted!", "You cleared round 1.")

    assert data["competition_name"] == "HUL L.I.M.E."
    assert capture["url"] == "https://openrouter.ai/api/v1/chat/completions"
    assert capture["headers"]["Authorization"] == "Bearer test-key"
    assert capture["json"]["model"] == "openai/gpt-oss-20b:free"
    assert capture["json"]["response_format"] == {"type": "json_object"}
    assert capture["json"]["messages"][0]["role"] == "system"
    assert capture["json"]["messages"][1]["role"] == "user"


def test_missing_api_key_is_unavailable(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    with pytest.raises(ExtractorUnavailable):
        OpenRouterExtractor().extract("s", "b")


def test_api_error_is_unavailable(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    install(monkeypatch, FakeResponse(429, {"error": {"message": "rate limited"}}))
    with pytest.raises(ExtractorUnavailable) as exc:
        OpenRouterExtractor().extract("s", "b")
    assert "429" in str(exc.value)


def test_factory_selects_openrouter(monkeypatch):
    monkeypatch.setattr("app.services.extractors.EXTRACTOR", "openrouter")
    from app.services.extractors import get_extractor

    assert isinstance(get_extractor(), OpenRouterExtractor)
