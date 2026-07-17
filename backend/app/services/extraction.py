"""Extraction pipeline: run the configured extractor over unprocessed
EmailRecords and route them.

Routing:
  irrelevant                      -> dismissed
  relevant + thread match         -> auto-merge (auto_linked); flagged cases
                                     (e.g. round_clear without a deadline)
                                     fall back to needs_review with the link kept
  relevant + high confidence      -> auto-update suggested match or create a
                                     new competition
  relevant + low confidence       -> needs_review
"""
from datetime import datetime

from sqlalchemy.orm import Session

from ..models import Competition, EmailRecord, ReviewStatus
from .extractors import (
    ExtractionParseError,
    Extractor,
    ExtractorUnavailable,
    get_extractor,
)
from .matching import find_fuzzy_suggestion, find_thread_match
from .transitions import apply_email_to_competition, status_for_new_competition

AUTO_CONFIRM_CONFIDENCE = 0.8


def process_unprocessed(db: Session, extractor: Extractor | None = None) -> dict:
    if extractor is None:
        extractor = get_extractor()

    records = (
        db.query(EmailRecord)
        .filter(EmailRecord.review_status == ReviewStatus.unprocessed)
        .order_by(EmailRecord.received_at.asc(), EmailRecord.id.asc())
        .all()
    )

    result = {
        "processed": 0,
        "needs_review": 0,
        "dismissed": 0,
        "auto_linked": 0,
        "parse_failed": 0,
        "extractor_error": None,
    }

    for record in records:
        body = record.raw_body_snippet
        if record.received_at:
            # Gives the model temporal context for relative dates
            # ("deadline this Friday") without changing the ABC signature.
            body = f"(Email received on {record.received_at:%Y-%m-%d})\n{body}"

        try:
            data = extractor.extract(record.subject, body)
        except ExtractorUnavailable as exc:
            # Backend down: leave this and all remaining records unprocessed
            # so the next sync/process run picks them up.
            result["extractor_error"] = str(exc)
            break
        except ExtractionParseError as exc:
            record.extracted_json = {"error": str(exc)}
            record.confidence = 0.0
            record.review_status = ReviewStatus.needs_review
            result["processed"] += 1
            result["parse_failed"] += 1
            result["needs_review"] += 1
            db.commit()  # per record — a later crash never loses finished work
            continue

        record.confidence = data["confidence"]
        if not data["is_relevant"]:
            record.extracted_json = data
            record.review_status = ReviewStatus.dismissed
            result["dismissed"] += 1
        else:
            _route_relevant(db, record, data, result)
        result["processed"] += 1
        db.commit()

    return result


def _route_relevant(db: Session, record: EmailRecord, data: dict, result: dict) -> None:
    comp = find_thread_match(db, record)
    if comp is not None:
        # Certain match (same Gmail thread already linked).
        record.competition_id = comp.id
        deadline = (
            datetime.fromisoformat(data["deadline"]) if data["deadline"] else None
        )
        _, flag = apply_email_to_competition(
            comp, data["email_type"], deadline, data["round_number"]
        )
        if flag:
            # Change withheld (e.g. round_clear without a deadline): keep the
            # certain link, but a human confirms the update.
            record.extracted_json = {**data, "flag": flag}
            record.review_status = ReviewStatus.needs_review
            result["needs_review"] += 1
        else:
            record.extracted_json = data
            record.review_status = ReviewStatus.auto_linked
            result["auto_linked"] += 1
        return

    suggestion = find_fuzzy_suggestion(db, record, data["competition_name"])
    if suggestion is not None:
        if data["confidence"] >= AUTO_CONFIRM_CONFIDENCE:
            _auto_apply_to_competition(record, suggestion, data, result)
            return
        record.extracted_json = {**data, "suggested_competition_id": suggestion.id}
    else:
        if data["confidence"] >= AUTO_CONFIRM_CONFIDENCE and data["competition_name"]:
            _auto_create_competition(db, record, data, result)
            return
        record.extracted_json = data
    record.review_status = ReviewStatus.needs_review
    result["needs_review"] += 1


def _auto_apply_to_competition(
    record: EmailRecord,
    comp: Competition,
    data: dict,
    result: dict,
) -> None:
    record.competition_id = comp.id
    deadline = datetime.fromisoformat(data["deadline"]) if data["deadline"] else None
    _, flag = apply_email_to_competition(
        comp, data["email_type"], deadline, data["round_number"]
    )
    if flag:
        record.extracted_json = {**data, "flag": flag}
        record.review_status = ReviewStatus.needs_review
        result["needs_review"] += 1
        return
    record.extracted_json = data
    record.review_status = ReviewStatus.auto_linked
    result["auto_linked"] += 1


def _auto_create_competition(
    db: Session,
    record: EmailRecord,
    data: dict,
    result: dict,
) -> None:
    deadline = datetime.fromisoformat(data["deadline"]) if data["deadline"] else None
    comp = Competition(
        name=data["competition_name"],
        organizer=data["organizer"] or "",
        platform=data["platform"],
        current_round=data["round_number"] or 1,
        current_deadline=deadline,
        status=status_for_new_competition(data["email_type"]),
    )
    db.add(comp)
    db.flush()
    record.competition_id = comp.id
    record.extracted_json = data
    record.review_status = ReviewStatus.auto_linked
    result["auto_linked"] += 1
