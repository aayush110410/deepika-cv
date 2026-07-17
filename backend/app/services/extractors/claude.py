"""Optional extractor: Anthropic API. NOT wired up by default.

Switching to it is one config change, no refactor:
  1. pip install anthropic
  2. put ANTHROPIC_API_KEY=... in backend/.env
  3. set EXTRACTOR=claude
The anthropic package is imported lazily, so it is not a dependency until
the switch is actually made.
"""
import os

from ...config import CLAUDE_MODEL
from .base import Extractor, ExtractorUnavailable, run_with_retry


class ClaudeExtractor(Extractor):
    def extract(self, subject: str, body: str) -> dict:
        return run_with_retry(self._complete, subject, body)

    def _complete(self, system: str, user: str) -> str:
        try:
            import anthropic
        except ImportError:
            raise ExtractorUnavailable(
                "The 'anthropic' package is not installed — run: pip install anthropic"
            )
        if not os.environ.get("ANTHROPIC_API_KEY"):
            raise ExtractorUnavailable(
                "ANTHROPIC_API_KEY is not set (put it in backend/.env)"
            )
        client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env
        try:
            response = client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=1024,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
        except anthropic.APIConnectionError as exc:
            raise ExtractorUnavailable(f"Cannot reach the Anthropic API: {exc}")
        except anthropic.APIStatusError as exc:
            raise ExtractorUnavailable(
                f"Anthropic API error {exc.status_code}: {exc.message}"
            )
        return "".join(
            block.text for block in response.content if block.type == "text"
        )
