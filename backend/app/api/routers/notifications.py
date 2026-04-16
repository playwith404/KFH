from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import CurrentUserDep
from app.db.session import get_db
from app.models.notification import Notification


router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_notifications(
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    notes = db.scalars(
        select(Notification).where(Notification.user_id == current.id).order_by(Notification.created_at.desc()).limit(200)
    ).all()
    return [
        {
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "body": n.body,
            "data": n.data_json,
            "read_at": n.read_at,
            "created_at": n.created_at,
        }
        for n in notes
    ]


@router.post("/{notification_id}/read")
def mark_read(
    notification_id: uuid.UUID,
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    n = db.get(Notification, notification_id)
    if not n or n.user_id != current.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    if n.read_at is None:
        n.read_at = datetime.now(timezone.utc)
        db.add(n)
        db.commit()
    return {"ok": True}


@router.post("/preferences")
def set_preferences():
    # MVP: store preferences in a dedicated table in the next iteration
    return {"ok": True}
