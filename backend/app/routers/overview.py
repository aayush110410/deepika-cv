"""One call powering the app chrome: tab counts, the Needs-review badge,
and the sync status indicator (also handy for the future native client)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import STATUS_BUCKETS, Competition, EmailRecord, ReviewStatus
from ..schemas import OverviewOut
from ..services import gmail_client
from ..services.gmail_sync import get_or_create_sync_state

router = APIRouter(prefix="/api/overview", tags=["overview"])


@router.get("", response_model=OverviewOut)
def get_overview(db: Session = Depends(get_db)):
    bucket_counts = {
        name: db.query(Competition)
        .filter(Competition.status.in_(statuses))
        .count()
        for name, statuses in STATUS_BUCKETS.items()
    }
    state = get_or_create_sync_state(db)
    return OverviewOut(
        **bucket_counts,
        needs_review=db.query(EmailRecord)
        .filter(EmailRecord.review_status == ReviewStatus.needs_review)
        .count(),
        last_synced_at=state.last_synced_at,
        gmail_connected=gmail_client.is_connected(),
    )
