from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import CurrentUserDep
from app.db.session import get_db
from app.models.enums import NotificationType, RewardRedemptionStatus, UserRole
from app.models.reward_catalog import RewardCatalog
from app.models.reward_redemption import RewardRedemption
from app.services.notifications import create_notification
from app.services.onboarding import require_hunter_verified
from app.services.points import add_points, get_point_balance


router = APIRouter(prefix="/rewards", tags=["rewards"])


class RewardOut(BaseModel):
    id: uuid.UUID
    title: str
    cost_points: int
    is_active: bool


@router.get("/catalog", response_model=list[RewardOut])
def catalog(db: Annotated[Session, Depends(get_db)]):
    items = db.scalars(select(RewardCatalog).where(RewardCatalog.is_active == True).order_by(RewardCatalog.cost_points.asc())).all()  # noqa: E712
    return [RewardOut(id=i.id, title=i.title, cost_points=i.cost_points, is_active=i.is_active) for i in items]


class RedemptionRequest(BaseModel):
    reward_id: uuid.UUID


@router.post("/redemptions")
def redeem(
    body: RedemptionRequest,
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    if current.role != UserRole.HUNTER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hunter only")
    try:
        require_hunter_verified(db, current)
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hunter not verified")

    reward = db.get(RewardCatalog, body.reward_id)
    if not reward or not reward.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reward not found")

    balance = get_point_balance(db, user_id=current.id)
    if balance < reward.cost_points:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient points")

    red = RewardRedemption(user_id=current.id, reward_id=reward.id, status=RewardRedemptionStatus.REQUESTED)
    db.add(red)
    db.commit()
    db.refresh(red)

    add_points(
        db,
        user_id=current.id,
        delta=-reward.cost_points,
        reason_code="REWARD_REDEEM",
        reference_type="reward_redemption",
        reference_id=str(red.id),
    )
    create_notification(
        db,
        user_id=current.id,
        type=NotificationType.REWARD,
        title="보상 교환 신청",
        body=f"'{reward.title}' 교환을 신청했습니다. (-{reward.cost_points}P)",
        data={"redemption_id": str(red.id), "reward_id": str(reward.id), "status": red.status.value},
    )
    return {"id": red.id, "status": red.status}


@router.get("/redemptions")
def my_redemptions(
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    reds = db.scalars(select(RewardRedemption).where(RewardRedemption.user_id == current.id).order_by(RewardRedemption.requested_at.desc()).limit(100)).all()
    return [
        {
            "id": r.id,
            "reward_id": r.reward_id,
            "status": r.status,
            "requested_at": r.requested_at,
            "processed_at": r.processed_at,
            "note": r.note,
        }
        for r in reds
    ]
