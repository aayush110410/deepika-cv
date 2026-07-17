"""The tab buckets must partition the status enum — every status shows up
in exactly one tab, or competitions silently vanish from the UI."""
from app.models import STATUS_BUCKETS, CompetitionStatus


def test_every_status_lands_in_exactly_one_bucket():
    seen = [status for statuses in STATUS_BUCKETS.values() for status in statuses]
    assert sorted(s.value for s in seen) == sorted(s.value for s in CompetitionStatus)
