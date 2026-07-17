from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import STATUS_BUCKETS, Competition, CompetitionStatus
from ..schemas import CompetitionCreate, CompetitionOut, CompetitionUpdate
from ..services.urgency import days_left, urgency_for

router = APIRouter(prefix="/api/competitions", tags=["competitions"])


def to_out(comp: Competition) -> CompetitionOut:
    fields = {c.name: getattr(comp, c.name) for c in Competition.__table__.columns}
    return CompetitionOut(
        **fields,
        urgency=urgency_for(comp.current_deadline),
        days_left=days_left(comp.current_deadline),
    )


def get_or_404(comp_id: int, db: Session) -> Competition:
    comp = db.get(Competition, comp_id)
    if comp is None:
        raise HTTPException(status_code=404, detail="Competition not found")
    return comp


@router.get("", response_model=list[CompetitionOut])
def list_competitions(
    status: CompetitionStatus | None = None,
    bucket: Literal["upcoming", "awaiting_result", "archive"] | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Competition)
    if status is not None:
        query = query.filter(Competition.status == status)
    if bucket is not None:
        query = query.filter(Competition.status.in_(STATUS_BUCKETS[bucket]))
    comps = query.order_by(
        Competition.current_deadline.is_(None),  # NULL deadlines last
        Competition.current_deadline.asc(),
        Competition.created_at.asc(),
    ).all()
    return [to_out(c) for c in comps]


@router.post("", response_model=CompetitionOut, status_code=201)
def create_competition(payload: CompetitionCreate, db: Session = Depends(get_db)):
    comp = Competition(**payload.model_dump())
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return to_out(comp)


@router.get("/{comp_id}", response_model=CompetitionOut)
def get_competition(comp_id: int, db: Session = Depends(get_db)):
    return to_out(get_or_404(comp_id, db))


@router.patch("/{comp_id}", response_model=CompetitionOut)
def update_competition(
    comp_id: int, payload: CompetitionUpdate, db: Session = Depends(get_db)
):
    comp = get_or_404(comp_id, db)
    changes = payload.model_dump(exclude_unset=True)
    for field, value in changes.items():
        if value is None and field != "current_deadline":
            continue  # current_deadline is the only nullable field
        setattr(comp, field, value)
    db.commit()
    db.refresh(comp)
    return to_out(comp)


@router.delete("/{comp_id}", status_code=204)
def delete_competition(comp_id: int, db: Session = Depends(get_db)):
    comp = get_or_404(comp_id, db)
    db.delete(comp)
    db.commit()
