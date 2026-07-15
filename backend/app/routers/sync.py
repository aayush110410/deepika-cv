from fastapi import APIRouter, Depends, HTTPException
from googleapiclient.errors import HttpError
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import EmailRecord
from ..schemas import SyncResultOut, SyncStatusOut
from ..services import gmail_client
from ..services.gmail_sync import get_or_create_sync_state, sync_now

router = APIRouter(prefix="/api/sync", tags=["sync"])


@router.get("/status", response_model=SyncStatusOut)
def sync_status(db: Session = Depends(get_db)):
    state = get_or_create_sync_state(db)
    return SyncStatusOut(
        gmail_connected=gmail_client.is_connected(),
        has_credentials_file=gmail_client.has_credentials_file(),
        last_synced_at=state.last_synced_at,
        email_count=db.query(EmailRecord).count(),
    )


@router.post("/now", response_model=SyncResultOut)
def run_sync(db: Session = Depends(get_db)):
    try:
        return sync_now(db)
    except gmail_client.GmailAuthError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except HttpError as exc:
        raise HTTPException(status_code=502, detail=f"Gmail API error: {exc}")
