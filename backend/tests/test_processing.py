"""Pipeline routing: relevant → needs_review, irrelevant → dismissed,
parse failure → needs_review at confidence 0, backend down → untouched."""
from app.models import EmailRecord, ReviewStatus
from app.services.extraction import process_unprocessed
from app.services.extractors import (
    ExtractionParseError,
    Extractor,
    ExtractorUnavailable,
)


def make_email(db, mid, subject="A case competition update"):
    record = EmailRecord(
        gmail_message_id=mid,
        gmail_thread_id=f"t-{mid}",
        sender="noreply@unstop.com",
        subject=subject,
        raw_body_snippet="body text",
    )
    db.add(record)
    db.commit()
    return record


class StubExtractor(Extractor):
    def __init__(self, result):
        self.result = result
        self.calls = 0

    def extract(self, subject, body):
        self.calls += 1
        if isinstance(self.result, Exception):
            raise self.result
        return self.result


RELEVANT = {
    "is_relevant": True,
    "competition_name": "HUL L.I.M.E.",
    "organizer": "HUL",
    "platform": "unstop",
    "deadline": "2026-07-25T23:59:00",
    "round_number": 2,
    "email_type": "round_clear",
    "confidence": 0.9,
}
IRRELEVANT = {**RELEVANT, "is_relevant": False, "confidence": 0.95}


def test_relevant_goes_to_needs_review(db):
    record = make_email(db, "m1")
    result = process_unprocessed(db, StubExtractor(RELEVANT))
    assert result == {
        "processed": 1,
        "needs_review": 1,
        "dismissed": 0,
        "parse_failed": 0,
        "extractor_error": None,
    }
    assert record.review_status == ReviewStatus.needs_review
    assert record.extracted_json["competition_name"] == "HUL L.I.M.E."
    assert record.confidence == 0.9


def test_irrelevant_is_dismissed(db):
    record = make_email(db, "m1")
    result = process_unprocessed(db, StubExtractor(IRRELEVANT))
    assert result["dismissed"] == 1 and result["needs_review"] == 0
    assert record.review_status == ReviewStatus.dismissed
    assert record.extracted_json["is_relevant"] is False


def test_parse_failure_marks_needs_review_confidence_zero(db):
    record = make_email(db, "m1")
    result = process_unprocessed(db, StubExtractor(ExtractionParseError("bad output twice")))
    assert result["parse_failed"] == 1 and result["needs_review"] == 1
    assert record.review_status == ReviewStatus.needs_review
    assert record.confidence == 0.0
    assert "bad output twice" in record.extracted_json["error"]


def test_backend_down_leaves_records_unprocessed(db):
    first = make_email(db, "m1")
    second = make_email(db, "m2")
    result = process_unprocessed(db, StubExtractor(ExtractorUnavailable("Ollama not reachable")))
    assert result["processed"] == 0
    assert "Ollama not reachable" in result["extractor_error"]
    assert first.review_status == ReviewStatus.unprocessed
    assert second.review_status == ReviewStatus.unprocessed
    assert first.extracted_json is None


def test_only_unprocessed_records_are_touched(db):
    done = make_email(db, "m1")
    done.review_status = ReviewStatus.confirmed
    db.commit()
    make_email(db, "m2")
    extractor = StubExtractor(RELEVANT)
    result = process_unprocessed(db, extractor)
    assert extractor.calls == 1
    assert result["processed"] == 1
    assert done.review_status == ReviewStatus.confirmed
