from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ReportHunterReview(Base):
    __tablename__ = "report_hunter_reviews"

    report_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("reports.id"), primary_key=True
    )

    check_1: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    check_2: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    check_3: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    check_4: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    check_5: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    check_6: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    check_7: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    check_8: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    rationale_text: Mapped[str] = mapped_column(Text, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
