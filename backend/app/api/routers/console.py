from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.core.rbac import require_role
from app.core.security import CurrentUserDep
from app.db.session import get_db
from app.models.bait import Bait
from app.models.enums import (
    EntityType,
    HuntSessionStatus,
    MessageSender,
    NotificationType,
    PoliceDecision,
    ReportStatus,
    RewardRedemptionStatus,
    UserRole,
    UserStatus,
)
from app.models.extracted_entity import ExtractedEntity
from app.models.hunt_message import HuntMessage
from app.models.hunt_session import HuntSession
from app.models.report import Report
from app.models.report_police_decision import ReportPoliceDecision
from app.models.reward_catalog import RewardCatalog
from app.models.reward_redemption import RewardRedemption
from app.models.user import User
from app.models.audit_log import AuditLog
from app.models.oath_document import OathDocument
from app.models.test import Test
from app.models.test_question import TestQuestion
from app.models.training_module import TrainingModule
from app.services.extraction import compute_indicator_hits, extract_entities
from app.services.notifications import create_notification
from app.services.points import add_points
from app.websocket.manager import manager


router = APIRouter(prefix="/console", tags=["console"])


PoliceOrAdminDep = Annotated[User, Depends(require_role({UserRole.POLICE, UserRole.ADMIN}))]
AdminDep = Annotated[User, Depends(require_role({UserRole.ADMIN}))]


def _audit(
    db: Session,
    *,
    actor: User,
    action: str,
    resource_type: str,
    resource_id: str,
    details: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            actor_user_id=actor.id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip=None,
            user_agent=None,
            details_json=details or {},
        )
    )
    db.commit()


class ConsoleReportOut(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    created_by_user_id: uuid.UUID
    status: ReportStatus
    stage1_indicator_hits: int
    stage1_pass: bool
    primary_evidence_key: str | None
    monitoring_until: datetime | None
    created_at: datetime


@router.get("/reports", response_model=list[ConsoleReportOut])
def console_list_reports(
    _: PoliceOrAdminDep,
    db: Annotated[Session, Depends(get_db)],
    status: ReportStatus | None = Query(default=None),
    status_filter: ReportStatus | None = Query(default=None),
):
    stmt = select(Report).order_by(Report.created_at.desc())
    effective_status = status or status_filter
    if effective_status:
        stmt = stmt.where(Report.status == effective_status)
    reports = db.scalars(stmt).all()
    return [
        ConsoleReportOut(
            id=r.id,
            session_id=r.session_id,
            created_by_user_id=r.created_by_user_id,
            status=r.status,
            stage1_indicator_hits=r.stage1_indicator_hits,
            stage1_pass=r.stage1_pass,
            primary_evidence_key=r.primary_evidence_key,
            monitoring_until=r.monitoring_until,
            created_at=r.created_at,
        )
        for r in reports
    ]


@router.get("/reports/{report_id}", response_model=ConsoleReportOut)
def console_get_report(
    report_id: uuid.UUID,
    _: PoliceOrAdminDep,
    db: Annotated[Session, Depends(get_db)],
):
    r = db.get(Report, report_id)
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return ConsoleReportOut(
        id=r.id,
        session_id=r.session_id,
        created_by_user_id=r.created_by_user_id,
        status=r.status,
        stage1_indicator_hits=r.stage1_indicator_hits,
        stage1_pass=r.stage1_pass,
        primary_evidence_key=r.primary_evidence_key,
        monitoring_until=r.monitoring_until,
        created_at=r.created_at,
    )


class DecisionRequest(BaseModel):
    decision: PoliceDecision
    comment_public: str | None = None
    comment_internal: str | None = None


@router.post("/reports/{report_id}/decision")
def console_decide_report(
    report_id: uuid.UUID,
    body: DecisionRequest,
    officer: PoliceOrAdminDep,
    db: Annotated[Session, Depends(get_db)],
):
    r = db.get(Report, report_id)
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    # prevent double decision conflicts
    if r.status in (ReportStatus.APPROVED, ReportStatus.REJECTED):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already decided")

    decision = ReportPoliceDecision(
        report_id=r.id,
        officer_user_id=officer.id,
        decision=body.decision,
        comment_public=body.comment_public,
        comment_internal=body.comment_internal,
        decided_at=datetime.now(timezone.utc),
    )
    db.merge(decision)

    now = datetime.now(timezone.utc)
    if body.decision == PoliceDecision.APPROVE:
        r.status = ReportStatus.APPROVED
        r.monitoring_until = None
        # points +300 for approval (idempotent)
        add_points(
            db,
            user_id=r.created_by_user_id,
            delta=300,
            reason_code="REPORT_APPROVED",
            reference_type="report",
            reference_id=str(r.id),
        )
    elif body.decision == PoliceDecision.REJECT:
        r.status = ReportStatus.REJECTED
    elif body.decision == PoliceDecision.MONITOR:
        r.status = ReportStatus.MONITORING
        r.monitoring_until = now + timedelta(days=30)
    else:
        # REQUEST_MORE: keep in awaiting police, but record decision comment
        r.status = ReportStatus.AWAITING_POLICE

    r.updated_at = now
    db.add(r)
    db.commit()
    _audit(
        db,
        actor=officer,
        action="REPORT_DECISION",
        resource_type="report",
        resource_id=str(r.id),
        details={"decision": body.decision.value},
    )
    if body.decision == PoliceDecision.APPROVE:
        title = "신고 승인"
        note_body = (body.comment_public or "승인 처리되었습니다.") + " (+300P)"
    elif body.decision == PoliceDecision.REJECT:
        title = "신고 반려"
        note_body = body.comment_public or "반려 처리되었습니다."
    elif body.decision == PoliceDecision.MONITOR:
        title = "신고 모니터링 전환"
        note_body = body.comment_public or "추가 신고를 기다리는 모니터링 대상으로 전환되었습니다."
    else:
        title = "신고 추가 확인 요청"
        note_body = body.comment_public or "추가 정보가 필요합니다."

    create_notification(
        db,
        user_id=r.created_by_user_id,
        type=NotificationType.REPORT,
        title=title,
        body=note_body,
        data={"report_id": str(r.id), "status": r.status.value, "decision": body.decision.value},
    )
    return {"ok": True, "status": r.status}


@router.get("/monitoring", response_model=list[ConsoleReportOut])
def console_monitoring(
    _: PoliceOrAdminDep,
    db: Annotated[Session, Depends(get_db)],
):
    reports = db.scalars(select(Report).where(Report.status == ReportStatus.MONITORING).order_by(Report.created_at.desc())).all()
    return [
        ConsoleReportOut(
            id=r.id,
            session_id=r.session_id,
            created_by_user_id=r.created_by_user_id,
            status=r.status,
            stage1_indicator_hits=r.stage1_indicator_hits,
            stage1_pass=r.stage1_pass,
            primary_evidence_key=r.primary_evidence_key,
            monitoring_until=r.monitoring_until,
            created_at=r.created_at,
        )
        for r in reports
    ]


class SimulateSessionRequest(BaseModel):
    bait_id: uuid.UUID | None = None
    persona_type: str | None = "어리숙한 노인"
    scammer_contact: str | None = None


@router.post("/hunt/sessions/simulate")
async def simulate_session(
    _: AdminDep,
    body: SimulateSessionRequest,
    db: Annotated[Session, Depends(get_db)],
):
    bait_id = body.bait_id
    if bait_id is None:
        bait = db.scalar(select(Bait).order_by(Bait.created_at.desc()))
        if not bait:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No baits exist")
        bait_id = bait.id
    session = HuntSession(
        bait_id=bait_id,
        status=HuntSessionStatus.ACTIVE,
        persona_type=body.persona_type,
        suspicion_score=0,
        scammer_contact=body.scammer_contact,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    bait = db.get(Bait, bait_id)
    if bait and bait.issued_to_user_id:
        # PRD: 접촉 유도 성공 +50P (세션 시작 이벤트로 데모 처리)
        add_points(
            db,
            user_id=bait.issued_to_user_id,
            delta=50,
            reason_code="SCAMMER_ENGAGED",
            reference_type="hunt_session",
            reference_id=str(session.id),
        )
        create_notification(
            db,
            user_id=bait.issued_to_user_id,
            type=NotificationType.SESSION,
            title="사냥 세션 시작",
            body="사기꾼 유입이 감지되었습니다. 실시간 관전으로 이동해 주세요.",
            data={"session_id": str(session.id)},
        )

    await manager.broadcast(
        session.id,
        {
            "type": "session_started",
            "ts": datetime.now(timezone.utc).isoformat(),
            "payload": {"session_id": str(session.id)},
        },
    )
    return {"id": session.id, "bait_id": session.bait_id, "status": session.status}


class SimulateMessageRequest(BaseModel):
    sender: str = Field(pattern=r"^(SCAMMER|AI|SYSTEM)$")
    content_text: str = Field(min_length=1)


@router.post("/hunt/sessions/{session_id}/messages")
async def simulate_message(
    session_id: uuid.UUID,
    _: AdminDep,
    body: SimulateMessageRequest,
    db: Annotated[Session, Depends(get_db)],
):
    session = db.get(HuntSession, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    msg = HuntMessage(session_id=session_id, sender=MessageSender(body.sender), content_text=body.content_text)
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # extraction
    extracted = extract_entities(body.content_text)
    created_entities: list[ExtractedEntity] = []
    for item in extracted:
        exists = db.scalar(
            select(ExtractedEntity.id).where(
                ExtractedEntity.session_id == session_id,
                ExtractedEntity.entity_type == item.entity_type,
                ExtractedEntity.value_normalized == item.value_normalized,
            )
        )
        if exists:
            continue
        ent = ExtractedEntity(
            session_id=session_id,
            entity_type=item.entity_type,
            value_normalized=item.value_normalized,
            value_masked=item.value_masked,
            confidence=item.confidence,
            evidence_message_id=msg.id,
        )
        db.add(ent)
        created_entities.append(ent)
    db.commit()

    # PRD: 계좌/URL 추출 +100P (데모)
    bait = db.get(Bait, session.bait_id)
    if bait and bait.issued_to_user_id and created_entities:
        for ent in created_entities:
            if ent.entity_type not in (EntityType.BANK_ACCOUNT, EntityType.URL):
                continue
            add_points(
                db,
                user_id=bait.issued_to_user_id,
                delta=100,
                reason_code="ENTITY_EXTRACTED",
                reference_type="extracted_entity",
                reference_id=str(ent.id),
            )
            create_notification(
                db,
                user_id=bait.issued_to_user_id,
                type=NotificationType.SESSION,
                title="정보 추출 성공",
                body=f"{ent.entity_type.value}: {ent.value_masked}",
                data={
                    "session_id": str(session_id),
                    "entity_id": str(ent.id),
                    "entity_type": ent.entity_type.value,
                },
            )

    # update suspicion score (based on 5 indicators)
    texts = db.scalars(select(HuntMessage.content_text).where(HuntMessage.session_id == session_id)).all()
    hits = compute_indicator_hits(list(texts))
    session.suspicion_score = min(100, hits * 20)
    db.add(session)
    db.commit()

    await manager.broadcast(
        session_id,
        {
            "type": "message_created",
            "ts": datetime.now(timezone.utc).isoformat(),
            "payload": {"id": str(msg.id), "sender": msg.sender.value, "content_text": msg.content_text, "created_at": msg.created_at.isoformat()},
        },
    )
    if extracted:
        for item in extracted:
            await manager.broadcast(
                session_id,
                {
                    "type": "entity_extracted",
                    "ts": datetime.now(timezone.utc).isoformat(),
                    "payload": {
                        "session_id": str(session_id),
                        "entity": {
                            "entity_type": item.entity_type.value,
                            "value_masked": item.value_masked,
                            "confidence": item.confidence,
                        },
                    },
                },
            )
    await manager.broadcast(
        session_id,
        {
            "type": "status_updated",
            "ts": datetime.now(timezone.utc).isoformat(),
            "payload": {"session_id": str(session_id), "suspicion_score": session.suspicion_score},
        },
    )
    return {"ok": True}


@router.get("/users")
def console_list_users(
    _: AdminDep,
    db: Annotated[Session, Depends(get_db)],
):
    users = db.scalars(select(User).order_by(User.created_at.desc()).limit(200)).all()
    return [{"id": u.id, "email": u.email, "role": u.role, "status": u.status, "created_at": u.created_at} for u in users]


class PatchUserRequest(BaseModel):
    role: UserRole | None = None
    status: UserStatus | None = None


@router.patch("/users/{user_id}")
def console_patch_user(
    user_id: uuid.UUID,
    body: PatchUserRequest,
    _: AdminDep,
    db: Annotated[Session, Depends(get_db)],
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if body.role:
        user.role = body.role
    if body.status:
        user.status = body.status
    db.add(user)
    db.commit()
    _audit(
        db,
        actor=_,
        action="USER_PATCH",
        resource_type="user",
        resource_id=str(user.id),
        details={"role": user.role.value, "status": user.status.value},
    )
    return {"ok": True}


@router.get("/rewards/redemptions")
def console_reward_redemptions(
    _: AdminDep,
    db: Annotated[Session, Depends(get_db)],
):
    reds = db.scalars(select(RewardRedemption).order_by(RewardRedemption.requested_at.desc()).limit(200)).all()
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "reward_id": r.reward_id,
            "status": r.status,
            "requested_at": r.requested_at,
            "processed_at": r.processed_at,
            "note": r.note,
        }
        for r in reds
    ]


class RewardDecisionRequest(BaseModel):
    approve: bool
    note: str | None = None


@router.post("/rewards/redemptions/{redemption_id}/decision")
def console_decide_redemption(
    redemption_id: uuid.UUID,
    body: RewardDecisionRequest,
    _: AdminDep,
    db: Annotated[Session, Depends(get_db)],
):
    red = db.get(RewardRedemption, redemption_id)
    if not red:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Redemption not found")
    now = datetime.now(timezone.utc)
    red.note = body.note
    red.processed_at = now
    red.status = RewardRedemptionStatus.APPROVED if body.approve else RewardRedemptionStatus.REJECTED
    db.add(red)
    db.commit()
    _audit(
        db,
        actor=_,
        action="REWARD_REDEMPTION_DECISION",
        resource_type="reward_redemption",
        resource_id=str(red.id),
        details={"approve": body.approve},
    )
    create_notification(
        db,
        user_id=red.user_id,
        type=NotificationType.REWARD,
        title="보상 교환 처리됨",
        body=("승인되었습니다." if body.approve else "반려되었습니다.") + (f" {body.note}" if body.note else ""),
        data={"redemption_id": str(red.id), "status": red.status.value},
    )
    return {"ok": True}


@router.get("/audit")
def console_audit(
    _: AdminDep,
    db: Annotated[Session, Depends(get_db)],
):
    logs = db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(200)).all()
    return [
        {
            "id": l.id,
            "actor_user_id": l.actor_user_id,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "created_at": l.created_at,
            "details": l.details_json,
        }
        for l in logs
    ]


class TrainingModuleIn(BaseModel):
    id: uuid.UUID | None = None
    title: str
    duration_seconds: int
    is_active: bool = True


@router.get("/content/training")
def console_get_training(
    _: AdminDep,
    db: Annotated[Session, Depends(get_db)],
):
    mods = db.scalars(select(TrainingModule).order_by(TrainingModule.created_at.asc())).all()
    return [
        {
            "id": m.id,
            "title": m.title,
            "duration_seconds": m.duration_seconds,
            "is_active": m.is_active,
        }
        for m in mods
    ]


@router.put("/content/training")
def console_put_training(
    admin: AdminDep,
    body: list[TrainingModuleIn],
    db: Annotated[Session, Depends(get_db)],
):
    for item in body:
        if item.id:
            m = db.get(TrainingModule, item.id)
            if not m:
                continue
            m.title = item.title
            m.duration_seconds = item.duration_seconds
            m.is_active = item.is_active
            db.add(m)
        else:
            db.add(
                TrainingModule(title=item.title, duration_seconds=item.duration_seconds, is_active=item.is_active)
            )
    db.commit()
    _audit(db, actor=admin, action="CONTENT_TRAINING_PUT", resource_type="content", resource_id="training")
    return {"ok": True}


@router.get("/content/tests")
def console_get_tests(
    _: AdminDep,
    db: Annotated[Session, Depends(get_db)],
):
    test = db.scalar(select(Test).where(Test.code == "hunter-qualification"))
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found")
    questions = db.scalars(select(TestQuestion).where(TestQuestion.test_id == test.id).order_by(TestQuestion.created_at.asc())).all()
    return {
        "id": test.id,
        "code": test.code,
        "title": test.title,
        "is_active": test.is_active,
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "options": q.options,
                "correct_index": q.correct_index,
            }
            for q in questions
        ],
    }


class TestPutIn(BaseModel):
    title: str
    is_active: bool = True
    questions: list[dict]


@router.put("/content/tests")
def console_put_tests(
    admin: AdminDep,
    body: TestPutIn,
    db: Annotated[Session, Depends(get_db)],
):
    test = db.scalar(select(Test).where(Test.code == "hunter-qualification"))
    if not test:
        test = Test(code="hunter-qualification", title=body.title, is_active=body.is_active)
        db.add(test)
        db.commit()
        db.refresh(test)
    else:
        test.title = body.title
        test.is_active = body.is_active
        db.add(test)
        db.commit()

    # Replace questions (demo)
    db.execute(delete(TestQuestion).where(TestQuestion.test_id == test.id))
    db.commit()

    for q in body.questions:
        db.add(
            TestQuestion(
                test_id=test.id,
                question_text=str(q.get("question_text", "")),
                options=list(q.get("options", [])),
                correct_index=int(q.get("correct_index", 0)),
            )
        )
    db.commit()

    _audit(db, actor=admin, action="CONTENT_TESTS_PUT", resource_type="content", resource_id="tests")
    return {"ok": True}


@router.get("/content/oaths")
def console_get_oaths(
    _: AdminDep,
    db: Annotated[Session, Depends(get_db)],
):
    doc = db.scalar(select(OathDocument).order_by(OathDocument.published_at.desc()))
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oath not found")
    return {"id": doc.id, "version": doc.version, "content_md": doc.content_md, "published_at": doc.published_at}


class OathPutIn(BaseModel):
    content_md: str


@router.put("/content/oaths")
def console_put_oaths(
    admin: AdminDep,
    body: OathPutIn,
    db: Annotated[Session, Depends(get_db)],
):
    latest = db.scalar(select(OathDocument).order_by(OathDocument.published_at.desc()))
    version = (latest.version + 1) if latest else 1
    doc = OathDocument(version=version, content_md=body.content_md, published_at=datetime.now(timezone.utc))
    db.add(doc)
    db.commit()
    _audit(db, actor=admin, action="CONTENT_OATHS_PUT", resource_type="content", resource_id="oaths")
    return {"ok": True, "id": doc.id, "version": doc.version}


@router.get("/rewards/catalog")
def console_rewards_catalog(
    _: AdminDep,
    db: Annotated[Session, Depends(get_db)],
):
    items = db.scalars(select(RewardCatalog).order_by(RewardCatalog.cost_points.asc())).all()
    return [
        {
            "id": i.id,
            "title": i.title,
            "cost_points": i.cost_points,
            "is_active": i.is_active,
            "inventory": i.inventory,
        }
        for i in items
    ]


class RewardCreateIn(BaseModel):
    title: str
    cost_points: int
    is_active: bool = True
    inventory: int | None = None


@router.post("/rewards/catalog")
def console_create_reward(
    admin: AdminDep,
    body: RewardCreateIn,
    db: Annotated[Session, Depends(get_db)],
):
    item = RewardCatalog(
        title=body.title, cost_points=body.cost_points, is_active=body.is_active, inventory=body.inventory
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    _audit(db, actor=admin, action="REWARD_CREATE", resource_type="reward", resource_id=str(item.id))
    return {"id": item.id}


class RewardPatchIn(BaseModel):
    title: str | None = None
    cost_points: int | None = None
    is_active: bool | None = None
    inventory: int | None = None


@router.patch("/rewards/catalog/{reward_id}")
def console_patch_reward(
    reward_id: uuid.UUID,
    admin: AdminDep,
    body: RewardPatchIn,
    db: Annotated[Session, Depends(get_db)],
):
    item = db.get(RewardCatalog, reward_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reward not found")
    if body.title is not None:
        item.title = body.title
    if body.cost_points is not None:
        item.cost_points = body.cost_points
    if body.is_active is not None:
        item.is_active = body.is_active
    if body.inventory is not None:
        item.inventory = body.inventory
    db.add(item)
    db.commit()
    _audit(db, actor=admin, action="REWARD_PATCH", resource_type="reward", resource_id=str(item.id))
    return {"ok": True}
