from datetime import datetime

from pydantic import BaseModel, Field

from .models import CompetitionStatus, Platform


class CompetitionCreate(BaseModel):
    name: str = Field(min_length=1)
    organizer: str = ""
    platform: Platform = Platform.other
    current_round: int = Field(default=1, ge=1)
    current_deadline: datetime | None = None
    status: CompetitionStatus = CompetitionStatus.upcoming
    notes: str = ""


class CompetitionUpdate(BaseModel):
    """Partial update. Only keys present in the request are applied;
    current_deadline is the only field an explicit null may clear."""

    name: str | None = Field(default=None, min_length=1)
    organizer: str | None = None
    platform: Platform | None = None
    current_round: int | None = Field(default=None, ge=1)
    current_deadline: datetime | None = None
    status: CompetitionStatus | None = None
    notes: str | None = None


class CompetitionOut(BaseModel):
    id: int
    name: str
    organizer: str
    platform: Platform
    current_round: int
    current_deadline: datetime | None
    status: CompetitionStatus
    notes: str
    created_at: datetime
    updated_at: datetime
    # Computed server-side so every client shares the same urgency rules.
    urgency: str
    days_left: float | None
