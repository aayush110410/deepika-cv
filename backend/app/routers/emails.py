from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import EmailRecord, ReviewStatus
from ..schemas import EmailRecordOut

router = APIRouter(prefix="/api/emails", tags=["emails"])


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
