import importlib
import sys
from urllib.parse import parse_qs, urlparse


def load_gmail_client(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client.apps.googleusercontent.com")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-secret")
    monkeypatch.setenv(
        "OAUTH_REDIRECT_URI", "https://deepika-cv.onrender.com/api/gmail/callback"
    )
    for name in ["app.services.gmail_client", "app.config"]:
        sys.modules.pop(name, None)
    return importlib.import_module("app.services.gmail_client")


def test_authorization_url_uses_server_side_web_flow_without_pkce(monkeypatch):
    gmail_client = load_gmail_client(monkeypatch)

    url = gmail_client.build_authorization_url()
    params = parse_qs(urlparse(url).query)

    assert params["redirect_uri"] == [
        "https://deepika-cv.onrender.com/api/gmail/callback"
    ]
    assert "code_challenge" not in params
    assert "code_challenge_method" not in params
