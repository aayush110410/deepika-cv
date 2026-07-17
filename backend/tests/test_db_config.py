import importlib
import sys


def test_blank_database_url_falls_back_to_database_path(monkeypatch, tmp_path):
    db_path = tmp_path / "casetrack.db"
    monkeypatch.setenv("DATABASE_URL", "")
    monkeypatch.setenv("DATABASE_PATH", str(db_path))
    sys.modules.pop("app.db", None)

    db = importlib.import_module("app.db")

    assert db.DATABASE_URL == f"sqlite:///{db_path}"
