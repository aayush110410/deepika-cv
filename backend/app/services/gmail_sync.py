"""Manual Gmail sync: pull pre-filtered messages since the last sync and
persist them as unprocessed EmailRecords. No extraction here (Phase 3), no
scheduler, no push — this runs only when the user clicks Sync Now."""
import base64
import html
import re
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from ..config import (
    BODY_SNIPPET_MAX_CHARS,
    GMAIL_INITIAL_SYNC_DAYS,
    GMAIL_MAX_MESSAGES_PER_SYNC,
    GMAIL_SEARCH_QUERY,
)
from ..models import EmailRecord, ReviewStatus, SyncState
from .gmail_client import get_gmail_service


def get_or_create_sync_state(db: Session) -> SyncState:
    state = db.query(SyncState).first()
    if state is None:
        state = SyncState()
        db.add(state)
        db.commit()
        db.refresh(state)
    return state


def _header(payload: dict, name: str) -> str:
    for h in payload.get("headers", []):
        if h.get("name", "").lower() == name.lower():
            return h.get("value", "")
    return ""


def _walk_parts(part: dict):
    yield part
    for child in part.get("parts") or []:
        yield from _walk_parts(child)


def _strip_html(markup: str) -> str:
    # Crude on purpose: we only store a plain-text snippet, not render it.
    markup = re.sub(r"(?is)<(script|style).*?</\1>", " ", markup)
    return html.unescape(re.sub(r"<[^>]+>", " ", markup))


def extract_body_text(payload: dict, fallback_snippet: str = "") -> str:
    """Best plain-text body: text/plain part, else stripped text/html,
    else Gmail's own short snippet. Whitespace-collapsed and truncated."""
    plain = htm = None
    for part in _walk_parts(payload):
        data = (part.get("body") or {}).get("data")
        if not data:
            continue
        text = base64.urlsafe_b64decode(data.encode()).decode("utf-8", errors="replace")
        mime = part.get("mimeType", "")
        if mime == "text/plain" and plain is None:
            plain = text
        elif mime == "text/html" and htm is None:
            htm = text
    body = plain or (_strip_html(htm) if htm else "") or fallback_snippet
    return " ".join(body.split())[:BODY_SNIPPET_MAX_CHARS]


def build_query(last_synced_at: datetime | None, now: datetime | None = None) -> str:
    """The tunable filter plus a time window: since last sync, or the
    initial-sync lookback on the very first run."""
    now = now or datetime.now()
    since = last_synced_at or (now - timedelta(days=GMAIL_INITIAL_SYNC_DAYS))
    return f"({GMAIL_SEARCH_QUERY}) after:{int(since.timestamp())}"


def sync_now(db: Session, service=None) -> dict:
    service = service or get_gmail_service()
    state = get_or_create_sync_state(db)
    query = build_query(state.last_synced_at)
    started_at = datetime.now()  # captured before listing so no gap next sync

    message_ids: list[str] = []
    page_token = None
    while len(message_ids) < GMAIL_MAX_MESSAGES_PER_SYNC:
        resp = (
            service.users()
            .messages()
            .list(userId="me", q=query, maxResults=100, pageToken=page_token)
            .execute()
        )
        message_ids += [m["id"] for m in resp.get("messages", [])]
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    truncated = len(message_ids) > GMAIL_MAX_MESSAGES_PER_SYNC
    message_ids = message_ids[:GMAIL_MAX_MESSAGES_PER_SYNC]

    stored = skipped = 0
    for mid in message_ids:
        if db.query(EmailRecord.id).filter_by(gmail_message_id=mid).first():
            skipped += 1
            continue
        msg = service.users().messages().get(userId="me", id=mid, format="full").execute()
        payload = msg.get("payload", {})
        received = None
        if msg.get("internalDate"):
            received = datetime.fromtimestamp(int(msg["internalDate"]) / 1000)
        db.add(
            EmailRecord(
                gmail_message_id=msg["id"],
                gmail_thread_id=msg.get("threadId", ""),
                sender=_header(payload, "From"),
                subject=_header(payload, "Subject"),
                received_at=received,
                raw_body_snippet=extract_body_text(payload, msg.get("snippet", "")),
                review_status=ReviewStatus.unprocessed,
            )
        )
        stored += 1

    state.last_synced_at = started_at
    try:
        state.last_history_id = str(
            service.users().getProfile(userId="me").execute().get("historyId", "")
        )
    except Exception:
        pass  # history id is informational only; never fail a sync over it
    db.commit()

    return {
        "matched": len(message_ids),
        "stored_new": stored,
        "skipped_existing": skipped,
        "truncated": truncated,
        "query_used": query,
        "synced_at": started_at,
    }
