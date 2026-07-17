"""Matching logic — Phase 4 mandated test area. The load-bearing invariant:
only gmail_thread_id matches may auto-merge; fuzzy matches are suggestions."""
from datetime import datetime

from app.models import Competition, CompetitionStatus, EmailRecord, ReviewStatus
from app.services.extraction import process_unprocessed
from app.services.matching import (
    find_fuzzy_suggestion,
    find_thread_match,
    name_similarity,
    sender_domain,
)
from app.services.extractors import Extractor


def make_comp(db, name="HUL L.I.M.E. Season 15", deadline=None, round_=1):
    comp = Competition(
        name=name,
        current_deadline=deadline,
        current_round=round_,
        status=CompetitionStatus.round_in_progress,
    )
    db.add(comp)
    db.commit()
    return comp


def make_email(
    db,
    mid,
    thread="thread-x",
    sender="Unstop <noreply@unstop.com>",
    subject="subject",
    competition_id=None,
    review_status=ReviewStatus.unprocessed,
):
    record = EmailRecord(
        gmail_message_id=mid,
        gmail_thread_id=thread,
        sender=sender,
        subject=subject,
        raw_body_snippet="body",
        competition_id=competition_id,
        review_status=review_status,
    )
    db.add(record)
    db.commit()
    return record


class StubExtractor(Extractor):
    def __init__(self, result):
        self.result = result

    def extract(self, subject, body):
        return self.result


def extraction(**overrides):
    base = {
        "is_relevant": True,
        "competition_name": "HUL L.I.M.E. Season 15",
        "organizer": "HUL",
        "platform": "unstop",
        "deadline": "2026-08-01T23:59:00",
        "round_number": None,
        "email_type": "round_clear",
        "confidence": 0.9,
    }
    return {**base, **overrides}


class TestHelpers:
    def test_sender_domain(self):
        assert sender_domain("Unstop <noreply@unstop.com>") == "unstop.com"
        assert sender_domain("hr@tata.com") == "tata.com"
        assert sender_domain("no-at-sign") == ""

    def test_name_similarity(self):
        assert name_similarity("HUL L.I.M.E. Season 15", "hul lime season 15") > 0.8
        assert name_similarity("HUL L.I.M.E.", "Amazon ACE Challenge") < 0.4


class TestThreadMatch:
    def test_finds_competition_linked_in_same_thread(self, db):
        comp = make_comp(db)
        make_email(db, "old", thread="t1", competition_id=comp.id,
                   review_status=ReviewStatus.confirmed)
        new = make_email(db, "new", thread="t1")
        assert find_thread_match(db, new).id == comp.id

    def test_ignores_other_threads_and_unlinked_emails(self, db):
        comp = make_comp(db)
        make_email(db, "other-thread", thread="t1", competition_id=comp.id)
        make_email(db, "same-thread-unlinked", thread="t2")
        new = make_email(db, "new", thread="t2")
        assert find_thread_match(db, new) is None

    def test_does_not_match_itself(self, db):
        new = make_email(db, "new", thread="t1")
        assert find_thread_match(db, new) is None


class TestFuzzySuggestion:
    def test_similar_name_and_known_domain_suggests(self, db):
        comp = make_comp(db)
        make_email(db, "old", thread="t1", competition_id=comp.id)  # teaches the domain
        new = make_email(db, "new", thread="t2")
        assert find_fuzzy_suggestion(db, new, "HUL LIME Season 15").id == comp.id

    def test_unknown_sender_domain_means_no_suggestion(self, db):
        comp = make_comp(db)
        make_email(db, "old", thread="t1", competition_id=comp.id)
        new = make_email(db, "new", thread="t2", sender="talent@randomcorp.io")
        assert find_fuzzy_suggestion(db, new, "HUL LIME Season 15") is None

    def test_dissimilar_name_means_no_suggestion(self, db):
        comp = make_comp(db)
        make_email(db, "old", thread="t1", competition_id=comp.id)
        new = make_email(db, "new", thread="t2")
        assert find_fuzzy_suggestion(db, new, "Flipkart WiRED 9.0") is None

    def test_no_name_means_no_suggestion(self, db):
        new = make_email(db, "new")
        assert find_fuzzy_suggestion(db, new, None) is None


class TestPipelineRouting:
    def test_thread_match_auto_merges_and_applies_round_clear(self, db):
        comp = make_comp(db, deadline=datetime(2026, 7, 25, 23, 59), round_=2)
        make_email(db, "old", thread="t1", competition_id=comp.id,
                   review_status=ReviewStatus.confirmed)
        new = make_email(db, "new", thread="t1")

        result = process_unprocessed(db, StubExtractor(extraction()))
        assert result["auto_linked"] == 1 and result["needs_review"] == 0
        assert new.review_status == ReviewStatus.auto_linked
        assert new.competition_id == comp.id
        assert comp.current_round == 3
        assert comp.status == CompetitionStatus.cleared_next_round
        assert comp.current_deadline == datetime(2026, 8, 1, 23, 59)

    def test_thread_match_round_clear_without_deadline_flags_instead(self, db):
        old_deadline = datetime(2026, 7, 25, 23, 59)
        comp = make_comp(db, deadline=old_deadline, round_=2)
        make_email(db, "old", thread="t1", competition_id=comp.id,
                   review_status=ReviewStatus.confirmed)
        new = make_email(db, "new", thread="t1")

        result = process_unprocessed(db, StubExtractor(extraction(deadline=None)))
        assert result["auto_linked"] == 0 and result["needs_review"] == 1
        assert new.review_status == ReviewStatus.needs_review
        assert new.competition_id == comp.id  # certain link is kept
        assert "flag" in new.extracted_json
        # Nothing on the competition moved, deadline above all:
        assert comp.current_deadline == old_deadline
        assert comp.current_round == 2
        assert comp.status == CompetitionStatus.round_in_progress

    def test_low_confidence_fuzzy_match_only_suggests(self, db):
        comp = make_comp(db, deadline=datetime(2026, 7, 25, 23, 59), round_=2)
        make_email(db, "old", thread="t1", competition_id=comp.id,
                   review_status=ReviewStatus.confirmed)
        new = make_email(db, "new", thread="t2")  # different thread!

        result = process_unprocessed(
            db,
            StubExtractor(
                extraction(competition_name="HUL LIME Season 15", confidence=0.65)
            ),
        )
        assert result["auto_linked"] == 0 and result["needs_review"] == 1
        assert new.review_status == ReviewStatus.needs_review
        assert new.competition_id is None
        assert new.extracted_json["suggested_competition_id"] == comp.id
        # Competition untouched:
        assert comp.current_round == 2
        assert comp.status == CompetitionStatus.round_in_progress

    def test_high_confidence_fuzzy_match_auto_updates_existing_competition(self, db):
        comp = make_comp(db, deadline=datetime(2026, 7, 25, 23, 59), round_=2)
        make_email(db, "old", thread="t1", competition_id=comp.id,
                   review_status=ReviewStatus.confirmed)
        new = make_email(db, "new", thread="t2")

        result = process_unprocessed(
            db,
            StubExtractor(
                extraction(
                    competition_name="HUL LIME Season 15",
                    email_type="submission_confirmed",
                    deadline=None,
                )
            ),
        )

        assert result["auto_linked"] == 1 and result["needs_review"] == 0
        assert new.review_status == ReviewStatus.auto_linked
        assert new.competition_id == comp.id
        assert comp.status == CompetitionStatus.awaiting_result

    def test_low_confidence_no_match_goes_to_plain_review(self, db):
        new = make_email(db, "new")
        result = process_unprocessed(db, StubExtractor(extraction(confidence=0.65)))
        assert result["needs_review"] == 1
        assert new.review_status == ReviewStatus.needs_review
        assert new.competition_id is None
        assert "suggested_competition_id" not in new.extracted_json

    def test_auto_merge_applies_reminder_deadline_refresh(self, db):
        comp = make_comp(db, deadline=datetime(2026, 7, 25, 23, 59), round_=2)
        make_email(db, "old", thread="t1", competition_id=comp.id,
                   review_status=ReviewStatus.confirmed)
        make_email(db, "new", thread="t1")

        process_unprocessed(
            db, StubExtractor(extraction(email_type="reminder", deadline="2026-07-28T18:00:00"))
        )
        assert comp.current_deadline == datetime(2026, 7, 28, 18, 0)
        assert comp.status == CompetitionStatus.round_in_progress  # status untouched
