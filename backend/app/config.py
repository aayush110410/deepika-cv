"""Tunable configuration. Every constant can be overridden via an
environment variable of the same name — no code changes needed."""
import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Gmail sync
# ---------------------------------------------------------------------------

# Server-side pre-filter, pure Gmail search syntax — tune freely.
# https://support.google.com/mail/answer/7190
GMAIL_SEARCH_QUERY = os.environ.get(
    "GMAIL_SEARCH_QUERY",
    'from:unstop.com OR "case competition" OR shortlisted OR round '
    "OR deadline OR submission OR selected",
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
