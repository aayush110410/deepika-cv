"""Gmail API auth + client. Desktop-app OAuth, gmail.readonly only.

The OAuth consent screen stays in Testing mode with the owner as the only
test user — nothing here needs Google app verification. credentials.json is
downloaded from Google Cloud Console; token.json is written after consent.
Both are gitignored.
"""
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

from ..config import GMAIL_CREDENTIALS_PATH, GMAIL_TOKEN_PATH

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


class GmailAuthError(Exception):
    pass


def _load_token() -> Credentials | None:
    if not GMAIL_TOKEN_PATH.exists():
        return None
    return Credentials.from_authorized_user_file(str(GMAIL_TOKEN_PATH), SCOPES)


def has_credentials_file() -> bool:
    return GMAIL_CREDENTIALS_PATH.exists()


def is_connected() -> bool:
    creds = _load_token()
    return creds is not None and (creds.valid or bool(creds.refresh_token))


def connect() -> None:
    """Run the interactive consent flow (opens the browser on this machine).
    No-op if a usable token already exists; delete token.json to re-consent."""
    if is_connected():
        return
    if not has_credentials_file():
        raise GmailAuthError(
            f"No {GMAIL_CREDENTIALS_PATH.name} found. Create Desktop-app OAuth "
            f"credentials in Google Cloud Console (Gmail API enabled, consent "
            f"screen in Testing mode with yourself as test user) and save the "
            f"downloaded file to {GMAIL_CREDENTIALS_PATH}."
        )
    flow = InstalledAppFlow.from_client_secrets_file(str(GMAIL_CREDENTIALS_PATH), SCOPES)
    creds = flow.run_local_server(port=0)
    GMAIL_TOKEN_PATH.write_text(creds.to_json())


def get_gmail_service():
    """Return an authorized Gmail API client, refreshing the token if needed."""
    creds = _load_token()
    if creds is None:
        raise GmailAuthError("Gmail is not connected yet — use Connect Gmail first.")
    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            GMAIL_TOKEN_PATH.write_text(creds.to_json())
        else:
            raise GmailAuthError(
                "Stored Gmail token is unusable — delete token.json and reconnect."
            )
    return build("gmail", "v1", credentials=creds, cache_discovery=False)
