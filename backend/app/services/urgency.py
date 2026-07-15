"""Deadline urgency banding.

Single source of truth for every client (web today, native later):
    red   — deadline within 3 days (includes overdue)
    amber — deadline within 7 days
    green — deadline 7+ days out
    grey  — no deadline set
"""
from datetime import datetime

RED_THRESHOLD_DAYS = 3
AMBER_THRESHOLD_DAYS = 7


def days_left(deadline: datetime | None, now: datetime | None = None) -> float | None:
    if deadline is None:
        return None
    now = now or datetime.now()
    return (deadline - now).total_seconds() / 86400


def urgency_for(deadline: datetime | None, now: datetime | None = None) -> str:
    remaining = days_left(deadline, now)
    if remaining is None:
        return "grey"
    if remaining < RED_THRESHOLD_DAYS:
        return "red"
    if remaining < AMBER_THRESHOLD_DAYS:
        return "amber"
    return "green"
