"""Extraction pipeline: run the configured extractor over unprocessed
EmailRecords and route them — irrelevant → dismissed, relevant →
needs_review. Everything goes through the review queue in this phase;
auto-merge is Phase 4."""
from sqlalchemy.orm import Session

from ..models import EmailRecord, ReviewStatus
from .extractors import (
    ExtractionParseError,
    Extractor,
    ExtractorUnavailable,
    get_extractor,
)


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

        record.extracted_json = data
        record.confidence = data["confidence"]
        if data["is_relevant"]:
            record.review_status = ReviewStatus.needs_review
            result["needs_review"] += 1
        else:
            record.review_status = ReviewStatus.dismissed
            result["dismissed"] += 1
        result["processed"] += 1
        db.commit()

    return result
