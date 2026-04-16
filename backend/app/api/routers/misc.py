from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import CurrentUserDep
from app.db.session import get_db
from app.models.bait_deployment import BaitDeployment
from app.models.enums import ReportStatus
from app.models.hunt_session import HuntSession
from app.models.report import Report
from app.services.points import get_point_balance


router = APIRouter(tags=["misc"])


@router.get("/public/metrics")
def public_metrics(db: Annotated[Session, Depends(get_db)]):
    total_sessions = db.scalar(select(func.count()).select_from(HuntSession)) or 0
    total_reports = db.scalar(select(func.count()).select_from(Report)) or 0
    return {"total_sessions": int(total_sessions), "total_reports": int(total_reports)}


@router.get("/me/summary")
def me_summary(
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    deployments_today = db.scalar(
        select(func.count()).select_from(BaitDeployment).where(BaitDeployment.user_id == current.id, BaitDeployment.deployed_at >= today_start)
    ) or 0

    active_sessions = db.scalar(select(func.count()).select_from(HuntSession)) or 0

    my_reports = db.scalar(
        select(func.count()).select_from(Report).where(Report.created_by_user_id == current.id)
    ) or 0

    approved = db.scalar(
        select(func.count()).select_from(Report).where(Report.created_by_user_id == current.id, Report.status == ReportStatus.APPROVED)
    ) or 0

    return {
        "me": {"id": str(current.id), "email": current.email, "role": current.role},
        "points_balance": get_point_balance(db, user_id=current.id),
        "kpi": {
            "deployments_today": int(deployments_today),
            "active_sessions_total": int(active_sessions),
            "my_reports_total": int(my_reports),
            "my_reports_approved": int(approved),
        },
    }
