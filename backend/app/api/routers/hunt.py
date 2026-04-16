from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import CurrentUserDep
from app.db.session import get_db
from app.models.bait import Bait
from app.models.enums import HuntSessionStatus, UserRole
from app.models.extracted_entity import ExtractedEntity
from app.models.hunt_message import HuntMessage
from app.models.hunt_session import HuntSession


router = APIRouter(prefix="/hunt", tags=["hunt"])


def _ensure_session_access(db: Session, *, current, session: HuntSession) -> None:
    if current.role in (UserRole.ADMIN, UserRole.POLICE):
        return
    bait = db.get(Bait, session.bait_id)
    if not bait or bait.issued_to_user_id != current.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")


class HuntSessionOut(BaseModel):
    id: uuid.UUID
    bait_id: uuid.UUID
    status: HuntSessionStatus
    persona_type: str | None
    suspicion_score: int
    started_at: datetime
    ended_at: datetime | None


@router.get("/sessions", response_model=list[HuntSessionOut])
def list_sessions(
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
    status_filter: HuntSessionStatus | None = Query(default=None, alias="status"),
):
    stmt = select(HuntSession).order_by(HuntSession.started_at.desc())
    if status_filter:
        stmt = stmt.where(HuntSession.status == status_filter)
    sessions = db.scalars(stmt).all()
    out: list[HuntSessionOut] = []
    for s in sessions:
        try:
            _ensure_session_access(db, current=current, session=s)
        except HTTPException:
            continue
        out.append(
            HuntSessionOut(
                id=s.id,
                bait_id=s.bait_id,
                status=s.status,
                persona_type=s.persona_type,
                suspicion_score=s.suspicion_score,
                started_at=s.started_at,
                ended_at=s.ended_at,
            )
        )
    return out


class ExtractedEntityOut(BaseModel):
    id: uuid.UUID
    entity_type: str
    value_masked: str
    confidence: float
    created_at: datetime


class HuntSessionDetailOut(HuntSessionOut):
    extracted_entities: list[ExtractedEntityOut] = []


@router.get("/sessions/{session_id}", response_model=HuntSessionDetailOut)
def get_session(
    session_id: uuid.UUID,
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    session = db.get(HuntSession, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    _ensure_session_access(db, current=current, session=session)
    entities = db.scalars(
        select(ExtractedEntity).where(ExtractedEntity.session_id == session_id).order_by(ExtractedEntity.created_at.asc())
    ).all()
    return HuntSessionDetailOut(
        id=session.id,
        bait_id=session.bait_id,
        status=session.status,
        persona_type=session.persona_type,
        suspicion_score=session.suspicion_score,
        started_at=session.started_at,
        ended_at=session.ended_at,
        extracted_entities=[
            ExtractedEntityOut(
                id=e.id,
                entity_type=e.entity_type.value,
                value_masked=e.value_masked,
                confidence=e.confidence,
                created_at=e.created_at,
            )
            for e in entities
        ],
    )


class HuntMessageOut(BaseModel):
    id: uuid.UUID
    sender: str
    content_text: str
    created_at: datetime


@router.get("/sessions/{session_id}/messages", response_model=list[HuntMessageOut])
def get_messages(
    session_id: uuid.UUID,
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
    after: datetime | None = Query(default=None),
):
    session = db.get(HuntSession, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    _ensure_session_access(db, current=current, session=session)
    stmt = select(HuntMessage).where(HuntMessage.session_id == session_id).order_by(HuntMessage.created_at.asc())
    if after:
        stmt = stmt.where(HuntMessage.created_at > after)
    msgs = db.scalars(stmt).all()
    return [
        HuntMessageOut(id=m.id, sender=m.sender.value, content_text=m.content_text, created_at=m.created_at) for m in msgs
    ]

