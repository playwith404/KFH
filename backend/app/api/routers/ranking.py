from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enums import UserRole
from app.models.point_ledger import PointLedger
from app.models.user import User


router = APIRouter(prefix="/ranking", tags=["ranking"])


@router.get("")
def ranking(
    db: Annotated[Session, Depends(get_db)],
    period: str = Query(default="weekly", pattern="^(weekly|monthly)$"),
):
    now = datetime.now(timezone.utc)
    since = now - (timedelta(days=7) if period == "weekly" else timedelta(days=30))

    stmt = (
        select(PointLedger.user_id, func.coalesce(func.sum(PointLedger.delta), 0).label("score"))
        .where(PointLedger.created_at >= since)
        .group_by(PointLedger.user_id)
        .order_by(func.sum(PointLedger.delta).desc())
        .limit(20)
    )
    rows = db.execute(stmt).all()
    user_ids = [r.user_id for r in rows]
    users = {u.id: u for u in db.scalars(select(User).where(User.id.in_(user_ids))).all()}
    return [
        {
            "user_id": str(r.user_id),
            "email": users.get(r.user_id).email if users.get(r.user_id) else None,
            "score": int(r.score),
        }
        for r in rows
        if users.get(r.user_id) and users[r.user_id].role == UserRole.HUNTER
    ]
