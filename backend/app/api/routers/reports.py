from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import CurrentUserDep
from app.db.session import get_db
from app.models.bait import Bait
from app.models.enums import ReportStatus, UserRole
from app.models.hunt_message import HuntMessage
from app.models.hunt_session import HuntSession
from app.models.report import Report
from app.models.report_hunter_review import ReportHunterReview
from app.models.report_police_decision import ReportPoliceDecision
from app.services.reports import submit_hunter_review


router = APIRouter(prefix="/reports", tags=["reports"])


def _ensure_session_access(db: Session, *, current, session: HuntSession) -> None:
    if current.role in (UserRole.ADMIN, UserRole.POLICE):
        return
    bait = db.get(Bait, session.bait_id)
    if not bait or bait.issued_to_user_id != current.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")


def _ensure_report_access(db: Session, *, current, report: Report) -> None:
    if current.role in (UserRole.ADMIN, UserRole.POLICE):
        return
    if report.created_by_user_id != current.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")


class ReportCreateRequest(BaseModel):
    session_id: uuid.UUID


class ReportOut(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    status: ReportStatus
    stage1_indicator_hits: int
    stage1_pass: bool
    primary_evidence_key: str | None
    monitoring_until: datetime | None
    created_at: datetime
    updated_at: datetime


@router.post("", response_model=ReportOut)
def create_report(
    body: ReportCreateRequest,
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    session = db.get(HuntSession, body.session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    _ensure_session_access(db, current=current, session=session)

    existing = db.scalar(
        select(Report).where(Report.session_id == session.id, Report.created_by_user_id == current.id).order_by(Report.created_at.desc())
    )
    if existing and existing.status == ReportStatus.DRAFT:
        r = existing
    else:
        r = Report(session_id=session.id, created_by_user_id=current.id, status=ReportStatus.DRAFT)
        db.add(r)
        db.commit()
        db.refresh(r)
    return ReportOut(
        id=r.id,
        session_id=r.session_id,
        status=r.status,
        stage1_indicator_hits=r.stage1_indicator_hits,
        stage1_pass=r.stage1_pass,
        primary_evidence_key=r.primary_evidence_key,
        monitoring_until=r.monitoring_until,
        created_at=r.created_at,
        updated_at=r.updated_at,
    )


@router.get("", response_model=list[ReportOut])
def list_reports(
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
    mine: bool = Query(default=True),
    status_filter: ReportStatus | None = Query(default=None, alias="status"),
):
    stmt = select(Report).order_by(Report.created_at.desc())
    if mine and current.role == UserRole.HUNTER:
        stmt = stmt.where(Report.created_by_user_id == current.id)
    if status_filter:
        stmt = stmt.where(Report.status == status_filter)
    reports = db.scalars(stmt).all()
    out: list[ReportOut] = []
    for r in reports:
        try:
            _ensure_report_access(db, current=current, report=r)
        except HTTPException:
            continue
        out.append(
            ReportOut(
                id=r.id,
                session_id=r.session_id,
                status=r.status,
                stage1_indicator_hits=r.stage1_indicator_hits,
                stage1_pass=r.stage1_pass,
                primary_evidence_key=r.primary_evidence_key,
                monitoring_until=r.monitoring_until,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
        )
    return out


class ReportDetailOut(ReportOut):
    hunter_review: dict | None = None
    police_decision: dict | None = None


@router.get("/{report_id}", response_model=ReportDetailOut)
def get_report(
    report_id: uuid.UUID,
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    r = db.get(Report, report_id)
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    _ensure_report_access(db, current=current, report=r)
    review = db.get(ReportHunterReview, report_id)
    decision = db.get(ReportPoliceDecision, report_id)
    return ReportDetailOut(
        id=r.id,
        session_id=r.session_id,
        status=r.status,
        stage1_indicator_hits=r.stage1_indicator_hits,
        stage1_pass=r.stage1_pass,
        primary_evidence_key=r.primary_evidence_key,
        monitoring_until=r.monitoring_until,
        created_at=r.created_at,
        updated_at=r.updated_at,
        hunter_review=(
            {
                "checklist": {
                    "c1": review.check_1,
                    "c2": review.check_2,
                    "c3": review.check_3,
                    "c4": review.check_4,
                    "c5": review.check_5,
                    "c6": review.check_6,
                    "c7": review.check_7,
                    "c8": review.check_8,
                },
                "rationale_text": review.rationale_text,
                "submitted_at": review.submitted_at,
            }
            if review
            else None
        ),
        police_decision=(
            {
                "decision": decision.decision,
                "comment_public": decision.comment_public,
                "comment_internal": decision.comment_internal,
                "decided_at": decision.decided_at,
            }
            if decision
            else None
        ),
    )


@router.get("/{report_id}/transcript")
def get_transcript(
    report_id: uuid.UUID,
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    r = db.get(Report, report_id)
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    _ensure_report_access(db, current=current, report=r)
    msgs = db.scalars(select(HuntMessage).where(HuntMessage.session_id == r.session_id).order_by(HuntMessage.created_at.asc())).all()
    return [
        {"id": m.id, "sender": m.sender.value, "content_text": m.content_text, "created_at": m.created_at} for m in msgs
    ]


class HunterReviewRequest(BaseModel):
    checklist: dict[str, bool]
    rationale_text: str = Field(min_length=10)


@router.post("/{report_id}/hunter-review", response_model=ReportOut)
def submit_review(
    report_id: uuid.UUID,
    body: HunterReviewRequest,
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    r = db.get(Report, report_id)
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    _ensure_report_access(db, current=current, report=r)

    if current.role != UserRole.HUNTER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hunter only")

    required = [f"c{i}" for i in range(1, 9)]
    if not all(body.checklist.get(k) is True for k in required):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Checklist incomplete")

    try:
        updated = submit_hunter_review(
            db,
            report=r,
            hunter=current,
            checklist=body.checklist,
            rationale_text=body.rationale_text,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return ReportOut(
        id=updated.id,
        session_id=updated.session_id,
        status=updated.status,
        stage1_indicator_hits=updated.stage1_indicator_hits,
        stage1_pass=updated.stage1_pass,
        primary_evidence_key=updated.primary_evidence_key,
        monitoring_until=updated.monitoring_until,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
    )
