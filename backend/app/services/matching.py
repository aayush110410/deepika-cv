"""Email → Competition matching, in strict priority order:

  1. gmail_thread_id already linked to a Competition  -> certain match.
     This is the ONLY path allowed to auto-merge (spec: do not lower the bar
     — wrong merges corrupt the deadline view).
  2. fuzzy name match (difflib, stdlib) + sender-domain match -> suggestion
     only; the record still goes to needs_review with the match preselected.
  3. anything else -> needs_review with no suggestion.
"""
import difflib
import re

from sqlalchemy.orm import Session

from ..config import FUZZY_NAME_THRESHOLD
from ..models import Competition, EmailRecord


def sender_domain(sender: str) -> str:
    """'Unstop <noreply@unstop.com>' -> 'unstop.com'"""
    match = re.search(r"@([\w.-]+)", sender or "")
    return match.group(1).lower().rstrip(".>") if match else ""


def _normalize(name: str) -> str:
    return " ".join(re.sub(r"[^a-z0-9 ]+", " ", name.lower()).split())


def name_similarity(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, _normalize(a), _normalize(b)).ratio()


def find_thread_match(db: Session, record: EmailRecord) -> Competition | None:
    """A Competition already linked to another email in this Gmail thread."""
    if not record.gmail_thread_id:
        return None
    linked = (
        db.query(EmailRecord)
        .filter(
            EmailRecord.gmail_thread_id == record.gmail_thread_id,
            EmailRecord.id != record.id,
            EmailRecord.competition_id.isnot(None),
        )
        .order_by(EmailRecord.id.desc())
        .first()
    )
    if linked is None:
        return None
    return db.get(Competition, linked.competition_id)


def find_fuzzy_suggestion(
    db: Session, record: EmailRecord, extracted_name: str | None
) -> Competition | None:
    """Medium-confidence candidate: similar name AND the sender's domain has
    been seen before on emails linked to that competition."""
    if not extracted_name:
        return None
    domain = sender_domain(record.sender)
    if not domain:
        return None

    best: tuple[Competition, float] | None = None
    for comp in db.query(Competition).all():
        ratio = name_similarity(extracted_name, comp.name)
        if ratio < FUZZY_NAME_THRESHOLD:
            continue
        linked_domains = {
            sender_domain(email.sender)
            for email in db.query(EmailRecord).filter(
                EmailRecord.competition_id == comp.id
            )
        }
        if domain not in linked_domains:
            continue
        if best is None or ratio > best[1]:
            best = (comp, ratio)
    return best[0] if best else None
