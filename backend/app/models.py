import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, String, Text
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
