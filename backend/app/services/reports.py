from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.evidence_occurrence import EvidenceOccurrence
from app.models.enums import EntityType, NotificationType, ReportStatus
from app.models.extracted_entity import ExtractedEntity
from app.models.hunt_message import HuntMessage
from app.models.report import Report
from app.models.report_hunter_review import ReportHunterReview
from app.models.user import User
from app.services.extraction import compute_indicator_hits
from app.services.notifications import create_notification


_EVIDENCE_PRIORITY: list[EntityType] = [
    EntityType.BANK_ACCOUNT,
    EntityType.URL,
    EntityType.PHONE,
    EntityType.MESSENGER_ID,
    EntityType.IP,
]


def choose_primary_evidence_key(db: Session, *, session_id: uuid.UUID) -> str | None:
    entities = db.scalars(select(ExtractedEntity).where(ExtractedEntity.session_id == session_id)).all()
    if not entities:
        return None
    for et in _EVIDENCE_PRIORITY:
        for e in entities:
            if e.entity_type == et:
                return e.value_normalized
    return entities[0].value_normalized


def compute_stage1(db: Session, *, session_id: uuid.UUID) -> tuple[int, bool]:
    texts = db.scalars(select(HuntMessage.content_text).where(HuntMessage.session_id == session_id)).all()
    hits = compute_indicator_hits(list(texts))
    return hits, hits >= 3


def submit_hunter_review(
    db: Session,
    *,
    report: Report,
    hunter: User,
    checklist: dict[str, bool],
    rationale_text: str,
    monitoring_days: int = 30,
) -> Report:
    if report.status not in (ReportStatus.DRAFT, ReportStatus.MONITORING):
        raise ValueError("Report not in a submittable state")

    existing_review = db.get(ReportHunterReview, report.id)
    if existing_review:
        raise ValueError("Hunter review already submitted")

    stage1_hits, stage1_pass = compute_stage1(db, session_id=report.session_id)
    report.stage1_indicator_hits = stage1_hits
    report.stage1_pass = stage1_pass
    report.primary_evidence_key = report.primary_evidence_key or choose_primary_evidence_key(
        db, session_id=report.session_id
    )
    if not report.primary_evidence_key:
        raise ValueError("No evidence to cross-validate")

    report.status = ReportStatus.SUBMITTED_BY_HUNTER
    report.updated_at = datetime.now(timezone.utc)

    review = ReportHunterReview(
        report_id=report.id,
        check_1=bool(checklist.get("c1")),
        check_2=bool(checklist.get("c2")),
        check_3=bool(checklist.get("c3")),
        check_4=bool(checklist.get("c4")),
        check_5=bool(checklist.get("c5")),
        check_6=bool(checklist.get("c6")),
        check_7=bool(checklist.get("c7")),
        check_8=bool(checklist.get("c8")),
        rationale_text=rationale_text,
        submitted_at=datetime.now(timezone.utc),
    )

    db.add(report)
    db.add(review)
    db.commit()

    # record evidence occurrence (unique per hunter)
    occ = EvidenceOccurrence(
        evidence_key=report.primary_evidence_key,
        report_id=report.id,
        hunter_user_id=hunter.id,
    )
    db.add(occ)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()

    # cross validation
    distinct_hunters = db.scalar(
        select(func.count(func.distinct(EvidenceOccurrence.hunter_user_id))).where(
            EvidenceOccurrence.evidence_key == report.primary_evidence_key
        )
    ) or 0

    if distinct_hunters >= 2:
        db.execute(
            update(Report)
            .where(
                Report.primary_evidence_key == report.primary_evidence_key,
                Report.status.notin_([ReportStatus.APPROVED, ReportStatus.REJECTED]),
            )
            .values(status=ReportStatus.AWAITING_POLICE, monitoring_until=None, updated_at=datetime.now(timezone.utc))
        )
        db.commit()
        hunter_ids = (
            db.scalars(
                select(EvidenceOccurrence.hunter_user_id)
                .where(EvidenceOccurrence.evidence_key == report.primary_evidence_key)
                .distinct()
            ).all()
        )
        for hid in hunter_ids:
            create_notification(
                db,
                user_id=hid,
                type=NotificationType.REPORT,
                title="교차검증 완료",
                body="동일 증거가 2명 이상 제출되어 경찰 검토 대상으로 이동했습니다.",
                data={"evidence_key": report.primary_evidence_key, "status": ReportStatus.AWAITING_POLICE.value},
            )
    else:
        report.status = ReportStatus.MONITORING
        report.monitoring_until = datetime.now(timezone.utc) + timedelta(days=monitoring_days)
        report.updated_at = datetime.now(timezone.utc)
        db.add(report)
        db.commit()
        create_notification(
            db,
            user_id=hunter.id,
            type=NotificationType.REPORT,
            title="신고 모니터링 등록",
            body="추가 신고를 기다리는 모니터링 대상으로 등록되었습니다(최대 30일).",
            data={
                "report_id": str(report.id),
                "evidence_key": report.primary_evidence_key,
                "status": ReportStatus.MONITORING.value,
                "monitoring_until": report.monitoring_until.isoformat() if report.monitoring_until else None,
            },
        )

    db.refresh(report)
    return report
