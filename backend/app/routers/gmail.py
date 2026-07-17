from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse

from ..schemas import GmailStatusOut
from ..services import gmail_client

router = APIRouter(prefix="/api/gmail", tags=["gmail"])


@router.get("/status", response_model=GmailStatusOut)
def get_status():
    return GmailStatusOut(
        connected=gmail_client.is_connected(),
        has_credentials_file=gmail_client.has_credentials_file(),
    )


@router.get("/authorize")
def authorize():
    """Redirect the browser to Google's consent screen (works from any
    device — this is the hosted-friendly replacement for the desktop flow)."""
    try:
        url = gmail_client.build_authorization_url()
    except gmail_client.GmailAuthError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    return RedirectResponse(url)


@router.get("/callback", response_class=HTMLResponse)
def callback(code: str | None = None, error: str | None = None):
    """Google redirects here after consent. Exchanges the code and shows the
    refresh token to save as GMAIL_REFRESH_TOKEN for restart-proof access."""
    if error or not code:
        return HTMLResponse(f"<p>Authorization failed: {error or 'no code returned'}.</p>")
    try:
        refresh_token = gmail_client.exchange_code(code)
    except Exception as exc:  # oauthlib raises various types
        return HTMLResponse(f"<p>Token exchange failed: {exc}</p>", status_code=400)

    token_line = (
        f"<p>For access to survive restarts on your host, set this env var and redeploy "
        f"(keep it private):</p><pre>GMAIL_REFRESH_TOKEN={refresh_token}</pre>"
        if refresh_token
        else "<p>(No refresh token returned — you may already have one set.)</p>"
    )
    return HTMLResponse(
        "<div style='font-family:system-ui;max-width:640px;margin:40px auto'>"
        "<h2>Gmail connected ✓</h2>"
        f"{token_line}"
        "<p><a href='/'>Continue to CaseTrack</a></p></div>"
    )
