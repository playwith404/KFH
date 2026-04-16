from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.point_ledger import PointLedger


def add_points(
    db: Session,
    *,
    user_id: uuid.UUID,
    delta: int,
    reason_code: str,
    reference_type: str,
    reference_id: str,
) -> PointLedger:
    entry = PointLedger(
        user_id=user_id,
        delta=delta,
        reason_code=reason_code,
        reference_type=reference_type,
        reference_id=reference_id,
    )
    db.add(entry)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.scalar(
            select(PointLedger).where(
                PointLedger.user_id == user_id,
                PointLedger.reference_type == reference_type,
                PointLedger.reference_id == reference_id,
                PointLedger.reason_code == reason_code,
            )
        )
        if existing:
            return existing
        raise
    db.refresh(entry)
    return entry


def get_point_balance(db: Session, *, user_id: uuid.UUID) -> int:
    total = db.scalar(select(func.coalesce(func.sum(PointLedger.delta), 0)).where(PointLedger.user_id == user_id))
    return int(total or 0)

