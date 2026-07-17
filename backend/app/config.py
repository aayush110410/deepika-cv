"""Tunable configuration. Every constant can be overridden via an
environment variable of the same name (or backend/.env) — no code changes
needed."""
import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BACKEND_DIR / ".env")

# ---------------------------------------------------------------------------
# Gmail sync
# ---------------------------------------------------------------------------

# Server-side pre-filter, pure Gmail search syntax — tune freely.
# https://support.google.com/mail/answer/7190
GMAIL_SEARCH_QUERY = os.environ.get(
    "GMAIL_SEARCH_QUERY",
    'from:unstop.com OR "case competition" OR competition OR registered '
    "OR registration OR shortlisted OR round OR deadline OR submission OR "
    'submitted OR result OR rejected OR "not selected" OR "not qualified" '
    "OR selected OR qualified OR guidelines",
)

# How far back the very first sync reaches (there is no last_synced_at yet).
GMAIL_INITIAL_SYNC_DAYS = int(os.environ.get("GMAIL_INITIAL_SYNC_DAYS", "30"))

# Safety cap so one sync can never flood the review queue.
GMAIL_MAX_MESSAGES_PER_SYNC = int(os.environ.get("GMAIL_MAX_MESSAGES_PER_SYNC", "200"))

# Stored body text is truncated to this many characters. Long enough for
# Phase 3 extraction to see deadlines; short enough to keep the DB tiny.
BODY_SNIPPET_MAX_CHARS = int(os.environ.get("BODY_SNIPPET_MAX_CHARS", "2000"))

# Desktop-app OAuth credentials (downloaded from Google Cloud Console) and
# the token issued after consent. Both are gitignored.
GMAIL_CREDENTIALS_PATH = Path(
    os.environ.get("GMAIL_CREDENTIALS_PATH", BACKEND_DIR / "credentials.json")
)
GMAIL_TOKEN_PATH = Path(os.environ.get("GMAIL_TOKEN_PATH", BACKEND_DIR / "token.json"))

# Web OAuth (for hosted deployments). The redirect URI must be registered in
# the Google Cloud console and match exactly. Client id/secret can come from
# env (preferred on a host) or from the downloaded credentials.json. After a
# one-time consent, GMAIL_REFRESH_TOKEN persists access across restarts on
# ephemeral hosts (Render) without needing token.json on disk.
OAUTH_REDIRECT_URI = os.environ.get(
    "OAUTH_REDIRECT_URI", "http://localhost:8000/api/gmail/callback"
)
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GMAIL_REFRESH_TOKEN = os.environ.get("GMAIL_REFRESH_TOKEN", "")

# ---------------------------------------------------------------------------
# Extraction (Phase 3)
# ---------------------------------------------------------------------------

# Which Extractor implementation to use:
#   "gemini" (default, hosted, free tier — needs GEMINI_API_KEY)
#   "ollama" (local model, free — needs Ollama running)
#   "claude" (Anthropic API — needs `pip install anthropic` + API key)
EXTRACTOR = os.environ.get("EXTRACTOR", "gemini")

# Gemini (default extractor). Set GEMINI_MODEL to your exact model string;
# for structured extraction a fast model has the largest free quota, but any
# model your key can access works (the error message names an unknown model).
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.1-pro-preview")
GEMINI_TIMEOUT_SECONDS = int(os.environ.get("GEMINI_TIMEOUT_SECONDS", "60"))

# Ollama (local alternative).
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2")
OLLAMA_TIMEOUT_SECONDS = int(os.environ.get("OLLAMA_TIMEOUT_SECONDS", "120"))

# Only used when EXTRACTOR=claude.
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-opus-4-8")

# ---------------------------------------------------------------------------
# Matching (Phase 4)
# ---------------------------------------------------------------------------

# Minimum difflib name-similarity (0-1) for a fuzzy match *suggestion*.
# Fuzzy matches never auto-merge regardless of this value — only exact
# gmail_thread_id matches do.
FUZZY_NAME_THRESHOLD = float(os.environ.get("FUZZY_NAME_THRESHOLD", "0.75"))
