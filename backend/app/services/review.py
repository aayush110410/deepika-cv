"""Review-queue actions: confirm (create or update a Competition and link
the email) and dismiss. All fields arrive user-edited from the review UI."""
from sqlalchemy.orm import Session

from ..models import Competition, CompetitionStatus, EmailRecord, ReviewStatus
from ..schemas import EmailConfirmIn


def confirm_email(db: Session, record: EmailRecord, payload: EmailConfirmIn) -> Competition:
    if payload.competition_id is not None:
        comp = db.get(Competition, payload.competition_id)
        if comp is None:
            raise LookupError("Competition not found")
        # Hard rule (also enforced in Phase 4 auto-merge): never overwrite an
        # existing deadline with null.
        if payload.deadline is not None:
            comp.current_deadline = payload.deadline
        if payload.round_number is not None:
            comp.current_round = payload.round_number
    else:
        if not payload.competition_name or not payload.competition_name.strip():
            raise ValueError("competition_name is required when creating a new competition")
        comp = Competition(
            name=payload.competition_name.strip(),
            organizer=payload.organizer or "",
            platform=payload.platform,
            current_round=payload.round_number or 1,
            current_deadline=payload.deadline,
            status=CompetitionStatus.upcoming,
        )
        db.add(comp)
        db.flush()

    record.competition_id = comp.id
    record.review_status = ReviewStatus.confirmed
    db.commit()
    db.refresh(comp)
    return comp


def dismiss_email(db: Session, record: EmailRecord) -> EmailRecord:
    record.review_status = ReviewStatus.dismissed
    db.commit()
    return record
