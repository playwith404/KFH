from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import CurrentUserDep
from app.db.session import get_db
from app.models.point_ledger import PointLedger
from app.services.points import get_point_balance


router = APIRouter(prefix="/points", tags=["points"])


class LedgerOut(BaseModel):
    id: uuid.UUID
    delta: int
    reason_code: str
    reference_type: str
    reference_id: str
    created_at: datetime


@router.get("/ledger")
def get_ledger(
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    entries = db.scalars(
        select(PointLedger).where(PointLedger.user_id == current.id).order_by(PointLedger.created_at.desc()).limit(200)
    ).all()
    return {
        "balance": get_point_balance(db, user_id=current.id),
        "entries": [
            LedgerOut(
                id=e.id,
                delta=e.delta,
                reason_code=e.reason_code,
                reference_type=e.reference_type,
                reference_id=e.reference_id,
                created_at=e.created_at,
            ).model_dump()
            for e in entries
        ],
    }

