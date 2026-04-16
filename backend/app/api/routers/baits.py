from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import CurrentUserDep
from app.db.session import get_db
from app.models.bait import Bait
from app.models.bait_deployment import BaitDeployment
from app.models.enums import DeploymentPlatform, UserRole
from app.services.baits import create_deployment, ensure_baits_for_user
from app.services.onboarding import require_hunter_verified


router = APIRouter(prefix="/baits", tags=["baits"])


def _require_verified_hunter(
    current: CurrentUserDep, db: Annotated[Session, Depends(get_db)]
):
    if current.role != UserRole.HUNTER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hunter only")
    try:
        require_hunter_verified(db, current)
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hunter not verified")
    return current


VerifiedHunterDep = Annotated[CurrentUserDep, Depends(_require_verified_hunter)]


class BaitOut(BaseModel):
    id: uuid.UUID
    template_id: uuid.UUID
    virtual_phone: str | None
    virtual_messenger_id: str | None
    rendered_body: str
    created_at: datetime


@router.get("", response_model=list[BaitOut])
def list_baits(
    current: VerifiedHunterDep,
    db: Annotated[Session, Depends(get_db)],
):
    baits = ensure_baits_for_user(db, user_id=current.id)
    return [
        BaitOut(
            id=b.id,
            template_id=b.template_id,
            virtual_phone=b.virtual_phone,
            virtual_messenger_id=b.virtual_messenger_id,
            rendered_body=b.rendered_body,
            created_at=b.created_at,
        )
        for b in baits
    ]


@router.get("/{bait_id}", response_model=BaitOut)
def get_bait(
    bait_id: uuid.UUID,
    current: VerifiedHunterDep,
    db: Annotated[Session, Depends(get_db)],
):
    bait = db.get(Bait, bait_id)
    if not bait or bait.issued_to_user_id != current.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bait not found")
    return BaitOut(
        id=bait.id,
        template_id=bait.template_id,
        virtual_phone=bait.virtual_phone,
        virtual_messenger_id=bait.virtual_messenger_id,
        rendered_body=bait.rendered_body,
        created_at=bait.created_at,
    )


class DeploymentCreateRequest(BaseModel):
    platform: DeploymentPlatform
    post_url: str | None = Field(default=None, max_length=1024)
    memo: str | None = None


class DeploymentOut(BaseModel):
    id: uuid.UUID
    bait_id: uuid.UUID
    platform: DeploymentPlatform
    post_url: str | None
    memo: str | None
    deployed_at: datetime


@router.post("/{bait_id}/deployments", response_model=DeploymentOut)
def create_bait_deployment(
    bait_id: uuid.UUID,
    body: DeploymentCreateRequest,
    current: VerifiedHunterDep,
    db: Annotated[Session, Depends(get_db)],
):
    bait = db.get(Bait, bait_id)
    if not bait or bait.issued_to_user_id != current.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bait not found")
    try:
        dep = create_deployment(
            db,
            bait=bait,
            user_id=current.id,
            platform=body.platform,
            post_url=body.post_url,
            memo=body.memo,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return DeploymentOut(
        id=dep.id,
        bait_id=dep.bait_id,
        platform=dep.platform,
        post_url=dep.post_url,
        memo=dep.memo,
        deployed_at=dep.deployed_at,
    )


@router.get("/{bait_id}/deployments", response_model=list[DeploymentOut])
def list_deployments(
    bait_id: uuid.UUID,
    current: VerifiedHunterDep,
    db: Annotated[Session, Depends(get_db)],
):
    bait = db.get(Bait, bait_id)
    if not bait or bait.issued_to_user_id != current.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bait not found")
    deps = db.scalars(select(BaitDeployment).where(BaitDeployment.bait_id == bait_id).order_by(BaitDeployment.deployed_at.desc())).all()
    return [
        DeploymentOut(
            id=d.id,
            bait_id=d.bait_id,
            platform=d.platform,
            post_url=d.post_url,
            memo=d.memo,
            deployed_at=d.deployed_at,
        )
        for d in deps
    ]


@router.get("/{bait_id}/stats")
def bait_stats(
    bait_id: uuid.UUID,
    current: VerifiedHunterDep,
    db: Annotated[Session, Depends(get_db)],
):
    bait = db.get(Bait, bait_id)
    if not bait or bait.issued_to_user_id != current.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bait not found")
    deployment_count = db.scalar(select(func.count()).select_from(BaitDeployment).where(BaitDeployment.bait_id == bait_id)) or 0
    # inbound sessions count
    from app.models.hunt_session import HuntSession

    session_count = db.scalar(select(func.count()).select_from(HuntSession).where(HuntSession.bait_id == bait_id)) or 0
    return {"deployment_count": int(deployment_count), "inbound_sessions": int(session_count)}
