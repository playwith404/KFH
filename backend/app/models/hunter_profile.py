from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import HunterLevel


class HunterProfile(Base):
    __tablename__ = "hunter_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), primary_key=True, index=True
    )
    hunter_number: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    level: Mapped[HunterLevel] = mapped_column(
        Enum(HunterLevel, name="hunter_level"), default=HunterLevel.TRAINEE, nullable=False
    )

    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    accuracy_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    is_dormant: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_active_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", lazy="joined")
