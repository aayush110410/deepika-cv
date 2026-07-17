import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# DATABASE_URL wins if set (e.g. a hosted Postgres/Turso for persistence on
# ephemeral hosts). Otherwise SQLite at DATABASE_PATH, defaulting to a file
# next to the backend. Point DATABASE_PATH at a mounted disk to persist on
# hosts with ephemeral filesystems.
DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "casetrack.db"
DB_PATH = os.environ.get("DATABASE_PATH", str(DEFAULT_DB_PATH))
DATABASE_URL = os.environ.get("DATABASE_URL") or f"sqlite:///{DB_PATH}"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
