"""Extractor selection. The EXTRACTOR env var ('gemini' | 'openrouter' |
'ollama' | 'claude') is the single switch — swapping backends is a config
change, not a refactor."""
from ...config import EXTRACTOR
from .base import (  # noqa: F401  (re-exported for callers and tests)
    ExtractionParseError,
    Extractor,
    ExtractorUnavailable,
    normalize_extraction,
    parse_llm_json,
    run_with_retry,
)


def get_extractor() -> Extractor:
    name = EXTRACTOR.strip().lower()
    if name == "gemini":
        from .gemini import GeminiExtractor

        return GeminiExtractor()
    if name == "openrouter":
        from .openrouter import OpenRouterExtractor

        return OpenRouterExtractor()
    if name == "ollama":
        from .ollama import OllamaExtractor

        return OllamaExtractor()
    if name == "claude":
        from .claude import ClaudeExtractor

        return ClaudeExtractor()
    raise ValueError(
        f"Unknown EXTRACTOR '{EXTRACTOR}' — expected 'gemini', 'openrouter', 'ollama', or 'claude'"
    )
