from datetime import datetime

from pydantic import BaseModel, Field

from .models import CompetitionStatus, Platform, ReviewStatus


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


class EmailRecordOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    gmail_message_id: str
    gmail_thread_id: str
    sender: str
    subject: str
    received_at: datetime | None
    raw_body_snippet: str
    extracted_json: dict | None
    confidence: float | None
    competition_id: int | None
    review_status: ReviewStatus


class EmailConfirmIn(BaseModel):
    """One-tap confirm from the review queue. competition_id null means
    'create a new Competition from these (user-edited) fields'."""

    competition_id: int | None = None
    competition_name: str | None = None
    organizer: str = ""
    platform: Platform = Platform.other
    deadline: datetime | None = None
    round_number: int | None = Field(default=None, ge=1)
    email_type: str = "other"


class ProcessResultOut(BaseModel):
    processed: int
    needs_review: int
    dismissed: int
    parse_failed: int
    extractor_error: str | None


class GmailStatusOut(BaseModel):
    connected: bool
    has_credentials_file: bool


class SyncStatusOut(BaseModel):
    gmail_connected: bool
    has_credentials_file: bool
    last_synced_at: datetime | None
    email_count: int


class SyncResultOut(BaseModel):
    matched: int
    stored_new: int
    skipped_existing: int
    truncated: bool
    query_used: str
    synced_at: datetime
    # Extraction now runs as part of every sync (Phase 3).
    extraction: ProcessResultOut
