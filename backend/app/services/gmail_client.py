"""Gmail auth — web OAuth (redirect) flow, so it works on a hosted server
where no browser runs on the backend machine.

Credential resolution order for API calls:
  1. GMAIL_REFRESH_TOKEN env var (survives ephemeral hosts like Render)
  2. token.json on disk (written after in-app consent; local/dev)

Client id/secret come from env (GOOGLE_CLIENT_ID/SECRET) or the downloaded
credentials.json ('web' or 'installed'). All secrets stay out of git.
"""
import json
import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from ..config import (
    GMAIL_CREDENTIALS_PATH,
    GMAIL_REFRESH_TOKEN,
    GMAIL_TOKEN_PATH,
    OAUTH_REDIRECT_URI,
)

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

# Google may return a superset of scopes (e.g. openid); don't fail on it.
os.environ.setdefault("OAUTHLIB_RELAX_TOKEN_SCOPE", "1")
# Allow an http localhost redirect during local dev (Render uses https).
if OAUTH_REDIRECT_URI.startswith(("http://localhost", "http://127.0.0.1")):
    os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")


class GmailAuthError(Exception):
    pass


def _client_config() -> dict | None:
    cid = os.environ.get("GOOGLE_CLIENT_ID")
    csec = os.environ.get("GOOGLE_CLIENT_SECRET")
    if cid and csec:
        return {
            "web": {
                "client_id": cid,
                "client_secret": csec,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        }
    if GMAIL_CREDENTIALS_PATH.exists():
        return json.loads(GMAIL_CREDENTIALS_PATH.read_text())
    return None


def _client_bits() -> dict | None:
    cfg = _client_config()
    if not cfg:
        return None
    return cfg.get("web") or cfg.get("installed")


def has_credentials_file() -> bool:
    """True when we have a client config (env vars or credentials.json)."""
    return _client_config() is not None


def _load_token() -> Credentials | None:
    if not GMAIL_TOKEN_PATH.exists():
        return None
    return Credentials.from_authorized_user_file(str(GMAIL_TOKEN_PATH), SCOPES)


def is_connected() -> bool:
    if GMAIL_REFRESH_TOKEN:
        return True
    creds = _load_token()
    return creds is not None and (creds.valid or bool(creds.refresh_token))


def _flow() -> Flow:
    cfg = _client_config()
    if not cfg:
        raise GmailAuthError(
            "No Google client config — set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET "
            "or place the downloaded credentials.json at "
            f"{GMAIL_CREDENTIALS_PATH}."
        )
    return Flow.from_client_config(cfg, scopes=SCOPES, redirect_uri=OAUTH_REDIRECT_URI)


def build_authorization_url() -> str:
    """The Google consent URL to send the user's browser to."""
    url, _state = _flow().authorization_url(
        access_type="offline",  # request a refresh token
        prompt="consent",  # force refresh token even on re-consent
    )
    return url


def exchange_code(code: str) -> str | None:
    """Complete consent: swap the code for tokens, persist to token.json,
    and return the refresh token (to set as GMAIL_REFRESH_TOKEN for
    restart-proof access on a host)."""
    flow = _flow()
    flow.fetch_token(code=code)
    creds = flow.credentials
    try:
        GMAIL_TOKEN_PATH.write_text(creds.to_json())
    except OSError:
        pass  # read-only fs — the env-var path is the durable one anyway
    return creds.refresh_token


def get_gmail_service():
    """Authorized Gmail client, refreshing the access token as needed."""
    if GMAIL_REFRESH_TOKEN:
        bits = _client_bits()
        if not bits:
            raise GmailAuthError(
                "GMAIL_REFRESH_TOKEN is set but the client config is missing "
                "(GOOGLE_CLIENT_ID/SECRET or credentials.json)."
            )
        creds = Credentials(
            token=None,
            refresh_token=GMAIL_REFRESH_TOKEN,
            token_uri=bits.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id=bits["client_id"],
            client_secret=bits["client_secret"],
            scopes=SCOPES,
        )
        creds.refresh(Request())
        return build("gmail", "v1", credentials=creds, cache_discovery=False)

    creds = _load_token()
    if creds is None:
        raise GmailAuthError("Gmail is not connected yet — use Connect Gmail first.")
    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            GMAIL_TOKEN_PATH.write_text(creds.to_json())
        else:
            raise GmailAuthError(
                "Stored Gmail token is unusable — reconnect (or set GMAIL_REFRESH_TOKEN)."
            )
    return build("gmail", "v1", credentials=creds, cache_discovery=False)
