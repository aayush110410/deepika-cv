"""Confirm/dismiss actions — including the never-null-a-deadline guard."""
from datetime import datetime

import pytest

from app.models import Competition, CompetitionStatus, EmailRecord, ReviewStatus
from app.schemas import EmailConfirmIn
from app.services.review import confirm_email, dismiss_email


def make_email(db):
    record = EmailRecord(
        gmail_message_id="m1",
        gmail_thread_id="t1",
        sender="noreply@unstop.com",
        subject="Shortlisted for Round 2",
        raw_body_snippet="...",
        review_status=ReviewStatus.needs_review,
    )
    db.add(record)
    db.commit()
    return record


def make_comp(db, deadline=None):
    comp = Competition(name="HUL L.I.M.E.", current_deadline=deadline)
    db.add(comp)
    db.commit()
    return comp


def test_confirm_creates_new_competition(db):
    record = make_email(db)
    payload = EmailConfirmIn(
        competition_name="HUL L.I.M.E.",
        organizer="HUL",
        platform="unstop",
        deadline=datetime(2026, 7, 25, 23, 59),
        round_number=2,
        email_type="round_clear",
    )
    comp = confirm_email(db, record, payload)
    assert comp.id is not None
    assert comp.name == "HUL L.I.M.E."
    assert comp.current_round == 2
    # Phase 4: a new comp born from a round_clear email starts in that state.
    assert comp.status == CompetitionStatus.cleared_next_round
    assert record.competition_id == comp.id
    assert record.review_status == ReviewStatus.confirmed


def test_confirm_updates_existing_competition(db):
    existing = make_comp(db, deadline=datetime(2026, 7, 20, 12, 0))
    record = make_email(db)
    payload = EmailConfirmIn(
        competition_id=existing.id,
        deadline=datetime(2026, 7, 25, 23, 59),
        round_number=3,
    )
    comp = confirm_email(db, record, payload)
    assert comp.id == existing.id
    assert comp.current_deadline == datetime(2026, 7, 25, 23, 59)
    assert comp.current_round == 3
    assert record.competition_id == existing.id


def test_confirm_never_nulls_an_existing_deadline(db):
    original = datetime(2026, 7, 20, 12, 0)
    existing = make_comp(db, deadline=original)
    record = make_email(db)
    payload = EmailConfirmIn(competition_id=existing.id, deadline=None, round_number=None)
    comp = confirm_email(db, record, payload)
    assert comp.current_deadline == original  # deadline survives a null
    assert comp.current_round == existing.current_round


def test_confirm_new_requires_name(db):
    record = make_email(db)
    with pytest.raises(ValueError):
        confirm_email(db, record, EmailConfirmIn(competition_name="  "))


def test_confirm_missing_competition_raises_lookup(db):
    record = make_email(db)
    with pytest.raises(LookupError):
        confirm_email(db, record, EmailConfirmIn(competition_id=999))


def test_dismiss(db):
    record = make_email(db)
    dismiss_email(db, record)
    assert record.review_status == ReviewStatus.dismissed
