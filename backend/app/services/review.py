"""Review-queue actions: confirm (create or update a Competition and link
the email) and dismiss. All fields arrive user-edited from the review UI,
so provided values always win — but the round-progression rules from
transitions.py still shape status, and a missing deadline never clears one."""
from sqlalchemy.orm import Session

from ..models import Competition, EmailRecord, ReviewStatus
from ..schemas import EmailConfirmIn
from .transitions import STATUS_FOR_EMAIL_TYPE, status_for_new_competition


def confirm_email(db: Session, record: EmailRecord, payload: EmailConfirmIn) -> Competition:
    if payload.competition_id is not None:
        comp = db.get(Competition, payload.competition_id)
        if comp is None:
            raise LookupError("Competition not found")
        # Hard rule (same as auto-merge): never overwrite a deadline with null.
        if payload.deadline is not None:
            comp.current_deadline = payload.deadline
        if payload.round_number is not None:
            comp.current_round = payload.round_number  # explicit value wins
        elif payload.email_type == "round_clear":
            comp.current_round += 1
        new_status = STATUS_FOR_EMAIL_TYPE.get(payload.email_type)
        if new_status is not None:
            comp.status = new_status
    else:
        if not payload.competition_name or not payload.competition_name.strip():
            raise ValueError("competition_name is required when creating a new competition")
        comp = Competition(
            name=payload.competition_name.strip(),
            organizer=payload.organizer or "",
            platform=payload.platform,
            current_round=payload.round_number or 1,
            current_deadline=payload.deadline,
            status=status_for_new_competition(payload.email_type),
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
