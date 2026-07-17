"""Round-progression rules — the single place email-driven status changes
happen (applied by auto-merge and by review confirms; manual PATCH edits
remain free-form and never pass through here).

Rules per spec:
  round_clear -> current_round += 1 (or the extracted round if higher),
                 status cleared_next_round, deadline replaced by the new one
  rejection   -> status rejected (lives in the archive from Phase 5 on)
  result      -> status completed
  registration/submission types -> move between registered, in-progress,
                                   and awaiting-result states
  reminder / announcement / other -> may refresh deadline/round, never status

Hard guard: a deadline is NEVER overwritten with null. A round_clear that
arrives without a parseable deadline makes no changes at all and returns a
flag so the record lands in the review queue instead.
"""
from datetime import datetime

from ..models import Competition, CompetitionStatus

STATUS_FOR_EMAIL_TYPE = {
    "registration_confirmed": CompetitionStatus.registered,
    "round_live": CompetitionStatus.round_in_progress,
    "submission_required": CompetitionStatus.round_in_progress,
    "submission_confirmed": CompetitionStatus.awaiting_result,
    "round_clear": CompetitionStatus.cleared_next_round,
    "rejection": CompetitionStatus.rejected,
    "result": CompetitionStatus.completed,
}


def apply_email_to_competition(
    comp: Competition,
    email_type: str,
    deadline: datetime | None,
    round_number: int | None,
) -> tuple[bool, str | None]:
    """Apply one email's extraction to an existing competition.

    Returns (changed, flag_reason). A non-null flag_reason means the change
    was NOT applied and the email must go through manual review.
    """
    if email_type == "round_clear":
        if deadline is None:
            return (
                False,
                "round_clear email without a parseable deadline — existing "
                "deadline kept, confirm the new one manually",
            )
        comp.current_round = max(comp.current_round + 1, round_number or 0)
        comp.status = CompetitionStatus.cleared_next_round
        comp.current_deadline = deadline
        return True, None

    if email_type in (
        "registration_confirmed",
        "round_live",
        "submission_required",
        "submission_confirmed",
    ):
        comp.status = STATUS_FOR_EMAIL_TYPE[email_type]
        changed = True
        if deadline is not None:
            comp.current_deadline = deadline
        if round_number is not None and round_number > comp.current_round:
            comp.current_round = round_number
        return changed, None

    if email_type == "rejection":
        comp.status = CompetitionStatus.rejected
        return True, None

    if email_type == "result":
        comp.status = CompetitionStatus.completed
        return True, None

    # announcement / reminder / other: refresh details, never touch status.
    changed = False
    if deadline is not None:
        comp.current_deadline = deadline
        changed = True
    if round_number is not None and round_number > comp.current_round:
        # Only ever raise the round — a late-arriving announcement for an
        # earlier round must not downgrade progress.
        comp.current_round = round_number
        changed = True
    return changed, None


def status_for_new_competition(email_type: str) -> CompetitionStatus:
    """Status for a Competition created straight from a reviewed email."""
    return STATUS_FOR_EMAIL_TYPE.get(email_type, CompetitionStatus.upcoming)
