from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models.enums import NotificationType
from app.models.notification import Notification


def create_notification(
    db: Session,
    *,
    user_id: uuid.UUID,
    type: NotificationType,
    title: str,
    body: str,
    data: dict | None = None,
) -> Notification:
    note = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        data_json=data or {},
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

