"""Round-progression rules — Phase 4 mandated test area."""
from datetime import datetime

from app.models import Competition, CompetitionStatus
from app.services.transitions import (
    apply_email_to_competition,
    status_for_new_competition,
)

OLD_DEADLINE = datetime(2026, 7, 20, 12, 0)
NEW_DEADLINE = datetime(2026, 8, 1, 23, 59)


def make_comp(round_=1, deadline=OLD_DEADLINE, status=CompetitionStatus.round_in_progress):
    # Column defaults only apply on insert; set fields explicitly for
    # pure-logic tests.
    return Competition(
        name="HUL L.I.M.E.",
        current_round=round_,
        current_deadline=deadline,
        status=status,
    )


class TestRoundClear:
    def test_increments_round_sets_status_replaces_deadline(self):
        comp = make_comp(round_=1)
        changed, flag = apply_email_to_competition(comp, "round_clear", NEW_DEADLINE, None)
        assert changed is True and flag is None
        assert comp.current_round == 2
        assert comp.status == CompetitionStatus.cleared_next_round
        assert comp.current_deadline == NEW_DEADLINE

    def test_uses_extracted_round_when_higher(self):
        comp = make_comp(round_=1)
        apply_email_to_competition(comp, "round_clear", NEW_DEADLINE, 4)
        assert comp.current_round == 4

    def test_never_moves_round_backwards(self):
        comp = make_comp(round_=3)
        apply_email_to_competition(comp, "round_clear", NEW_DEADLINE, 2)
        assert comp.current_round == 4  # increment wins over a stale lower number

    def test_no_deadline_changes_nothing_and_flags(self):
        comp = make_comp(round_=2)
        changed, flag = apply_email_to_competition(comp, "round_clear", None, 3)
        assert changed is False and flag is not None
        assert comp.current_round == 2  # untouched
        assert comp.status == CompetitionStatus.round_in_progress  # untouched
        assert comp.current_deadline == OLD_DEADLINE  # never nulled

    def test_no_deadline_still_flags_when_comp_had_none(self):
        comp = make_comp(deadline=None)
        changed, flag = apply_email_to_competition(comp, "round_clear", None, None)
        assert changed is False and flag is not None
        assert comp.current_deadline is None


class TestTerminalTypes:
    def test_rejection_sets_rejected_and_touches_nothing_else(self):
        comp = make_comp(round_=2)
        changed, flag = apply_email_to_competition(comp, "rejection", None, None)
        assert changed is True and flag is None
        assert comp.status == CompetitionStatus.rejected
        assert comp.current_round == 2
        assert comp.current_deadline == OLD_DEADLINE

    def test_result_sets_completed(self):
        comp = make_comp()
        apply_email_to_competition(comp, "result", None, None)
        assert comp.status == CompetitionStatus.completed


class TestInformationalTypes:
    def test_reminder_with_deadline_updates_it_only(self):
        comp = make_comp(round_=2)
        changed, flag = apply_email_to_competition(comp, "reminder", NEW_DEADLINE, None)
        assert changed is True and flag is None
        assert comp.current_deadline == NEW_DEADLINE
        assert comp.status == CompetitionStatus.round_in_progress
        assert comp.current_round == 2

    def test_reminder_without_deadline_is_a_quiet_noop(self):
        comp = make_comp()
        changed, flag = apply_email_to_competition(comp, "reminder", None, None)
        assert changed is False and flag is None
        assert comp.current_deadline == OLD_DEADLINE

    def test_announcement_never_downgrades_round(self):
        comp = make_comp(round_=3)
        apply_email_to_competition(comp, "announcement", None, 1)
        assert comp.current_round == 3

    def test_announcement_raises_round_when_higher(self):
        comp = make_comp(round_=1)
        apply_email_to_competition(comp, "other", None, 2)
        assert comp.current_round == 2


def test_status_for_new_competition():
    assert status_for_new_competition("round_clear") == CompetitionStatus.cleared_next_round
    assert status_for_new_competition("rejection") == CompetitionStatus.rejected
    assert status_for_new_competition("result") == CompetitionStatus.completed
    assert status_for_new_competition("announcement") == CompetitionStatus.upcoming
    assert status_for_new_competition("other") == CompetitionStatus.upcoming
