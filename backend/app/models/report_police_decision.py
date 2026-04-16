from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import PoliceDecision


class ReportPoliceDecision(Base):
    __tablename__ = "report_police_decisions"

    report_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("reports.id"), primary_key=True
    )
    officer_user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False
    )

    decision: Mapped[PoliceDecision] = mapped_column(Enum(PoliceDecision, name="police_decision"), nullable=False)
    comment_public: Mapped[str | None] = mapped_column(Text, nullable=True)
    comment_internal: Mapped[str | None] = mapped_column(Text, nullable=True)
    decided_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
