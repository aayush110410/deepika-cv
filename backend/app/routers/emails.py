from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import EmailRecord, ReviewStatus
from ..schemas import CompetitionOut, EmailConfirmIn, EmailRecordOut, ProcessResultOut
from ..services.extraction import process_unprocessed
from ..services.review import confirm_email, dismiss_email
from .competitions import to_out

router = APIRouter(prefix="/api/emails", tags=["emails"])


def get_email_or_404(email_id: int, db: Session) -> EmailRecord:
    record = db.get(EmailRecord, email_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Email record not found")
    return record


@router.get("", response_model=list[EmailRecordOut])
def list_emails(
    review_status: ReviewStatus | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(EmailRecord)
    if review_status is not None:
        query = query.filter(EmailRecord.review_status == review_status)
    records = (
        query.order_by(EmailRecord.received_at.desc(), EmailRecord.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return records


@router.post("/process", response_model=ProcessResultOut)
def process_emails(db: Session = Depends(get_db)):
    """Run extraction over all unprocessed emails (also happens on every
    sync — this exists to retry after e.g. Ollama was down)."""
    return process_unprocessed(db)


@router.post("/{email_id}/confirm", response_model=CompetitionOut)
def confirm(email_id: int, payload: EmailConfirmIn, db: Session = Depends(get_db)):
    record = get_email_or_404(email_id, db)
    try:
        comp = confirm_email(db, record, payload)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return to_out(comp)


@router.post("/{email_id}/dismiss", response_model=EmailRecordOut)
def dismiss(email_id: int, db: Session = Depends(get_db)):
    record = get_email_or_404(email_id, db)
    return dismiss_email(db, record)
