from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import DeploymentPlatform


class BaitDeployment(Base):
    __tablename__ = "bait_deployments"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bait_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("baits.id"), index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False
    )

    platform: Mapped[DeploymentPlatform] = mapped_column(
        Enum(DeploymentPlatform, name="deployment_platform"), nullable=False
    )
    post_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    memo: Mapped[str | None] = mapped_column(Text, nullable=True)

    deployed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
