import enum
from datetime import datetime

from sqlalchemy import JSON, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Platform(str, enum.Enum):
    unstop = "unstop"
    direct = "direct"
    other = "other"


class CompetitionStatus(str, enum.Enum):
    upcoming = "upcoming"
    registered = "registered"
    round_in_progress = "round_in_progress"
    awaiting_result = "awaiting_result"
    cleared_next_round = "cleared_next_round"
    completed = "completed"
    rejected = "rejected"


# Tab buckets (Phase 5). Defined server-side so every client groups
# statuses identically: round_clear keeps a comp in the upcoming list,
# rejection/result move it to the archive.
STATUS_BUCKETS: dict[str, list[CompetitionStatus]] = {
    "upcoming": [
        CompetitionStatus.upcoming,
        CompetitionStatus.registered,
        CompetitionStatus.round_in_progress,
        CompetitionStatus.cleared_next_round,
    ],
    "awaiting_result": [CompetitionStatus.awaiting_result],
    "archive": [CompetitionStatus.completed, CompetitionStatus.rejected],
}


class Competition(Base):
    __tablename__ = "competitions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    organizer: Mapped[str] = mapped_column(String, default="", nullable=False)
    platform: Mapped[Platform] = mapped_column(
        Enum(Platform, native_enum=False), default=Platform.other, nullable=False
    )
    current_round: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    current_deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[CompetitionStatus] = mapped_column(
        Enum(CompetitionStatus, native_enum=False),
        default=CompetitionStatus.upcoming,
        nullable=False,
    )
    notes: Mapped[str] = mapped_column(Text, default="", nullable=False)
    # Naive local time throughout: single user, single machine.
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now, nullable=False
    )


class ReviewStatus(str, enum.Enum):
    unprocessed = "unprocessed"
    auto_linked = "auto_linked"
    needs_review = "needs_review"
    confirmed = "confirmed"
    dismissed = "dismissed"


class EmailRecord(Base):
    __tablename__ = "email_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    gmail_message_id: Mapped[str] = mapped_column(
        String, unique=True, index=True, nullable=False
    )
    gmail_thread_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    sender: Mapped[str] = mapped_column(String, default="", nullable=False)
    subject: Mapped[str] = mapped_column(String, default="", nullable=False)
    received_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    raw_body_snippet: Mapped[str] = mapped_column(Text, default="", nullable=False)
    # Filled by extraction (Phase 3); nullable until then.
    extracted_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    competition_id: Mapped[int | None] = mapped_column(
        ForeignKey("competitions.id"), nullable=True
    )
    review_status: Mapped[ReviewStatus] = mapped_column(
        Enum(ReviewStatus, native_enum=False),
        default=ReviewStatus.unprocessed,
        nullable=False,
    )


class SyncState(Base):
    """Single-row table: when the last manual sync ran."""

    __tablename__ = "sync_state"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_history_id: Mapped[str | None] = mapped_column(String, nullable=True)
