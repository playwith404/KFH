from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import HuntSessionStatus


class HuntSession(Base):
    __tablename__ = "hunt_sessions"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bait_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("baits.id"), index=True, nullable=False
    )

    status: Mapped[HuntSessionStatus] = mapped_column(
        Enum(HuntSessionStatus, name="hunt_session_status"),
        default=HuntSessionStatus.ACTIVE,
        nullable=False,
        index=True,
    )
    persona_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    suspicion_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    scammer_contact: Mapped[str | None] = mapped_column(String(128), nullable=True)
    scammer_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    scammer_user_agent: Mapped[str | None] = mapped_column(String(256), nullable=True)

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
