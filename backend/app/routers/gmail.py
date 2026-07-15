from fastapi import APIRouter, HTTPException

from ..schemas import GmailStatusOut
from ..services import gmail_client

router = APIRouter(prefix="/api/gmail", tags=["gmail"])


def status() -> GmailStatusOut:
    return GmailStatusOut(
        connected=gmail_client.is_connected(),
        has_credentials_file=gmail_client.has_credentials_file(),
    )


@router.get("/status", response_model=GmailStatusOut)
def get_status():
    return status()


@router.post("/connect", response_model=GmailStatusOut)
def connect():
    """Runs the OAuth consent flow. The browser opens on the machine running
    the backend; this request blocks until consent completes."""
    try:
        gmail_client.connect()
    except gmail_client.GmailAuthError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    return status()
