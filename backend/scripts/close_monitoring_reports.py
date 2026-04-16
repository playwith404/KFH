from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select, update

from app.db.session import SessionLocal
from app.models.enums import NotificationType, ReportStatus
from app.models.report import Report
from app.services.notifications import create_notification


def main() -> None:
    now = datetime.now(timezone.utc)
    db = SessionLocal()
    try:
        # Find expired monitoring reports
        expired = db.scalars(
            select(Report).where(
                Report.status == ReportStatus.MONITORING,
                Report.monitoring_until.is_not(None),
                Report.monitoring_until < now,
            )
        ).all()

        if not expired:
            print("No expired monitoring reports.")
            return

        report_ids = [r.id for r in expired]
        db.execute(
            update(Report)
            .where(Report.id.in_(report_ids))
            .values(status=ReportStatus.CLOSED_NO_CONFIRM, updated_at=now)
        )
        db.commit()

        for r in expired:
            create_notification(
                db,
                user_id=r.created_by_user_id,
                type=NotificationType.REPORT,
                title="모니터링 종료",
                body="30일 내 추가 교차검증 신고가 없어 종결되었습니다.",
                data={"report_id": str(r.id), "status": ReportStatus.CLOSED_NO_CONFIRM.value},
            )

        print(f"Closed {len(report_ids)} report(s) as CLOSED_NO_CONFIRM.")
    finally:
        db.close()


if __name__ == "__main__":
    main()

