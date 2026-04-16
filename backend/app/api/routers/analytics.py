from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.bait_deployment import BaitDeployment
from app.models.hunt_session import HuntSession


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/global")
def global_metrics(db: Annotated[Session, Depends(get_db)]):
    total_deployments = db.scalar(select(func.count()).select_from(BaitDeployment)) or 0
    total_sessions = db.scalar(select(func.count()).select_from(HuntSession)) or 0

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_deployments = db.scalar(
        select(func.count()).select_from(BaitDeployment).where(BaitDeployment.deployed_at >= today_start)
    ) or 0

    pollution_percent = 0.0
    if total_deployments:
        pollution_percent = min(100.0, round((total_sessions / total_deployments) * 100, 2))

    return {
        "pollution_percent": pollution_percent,
        "crime_profit_change_percent": -15.0,  # demo placeholder
        "today_activity_count": int(today_deployments),
        "total_sessions": int(total_sessions),
        "total_deployments": int(total_deployments),
    }


@router.get("/map-dots")
def map_dots():
    # MVP: no real geo yet. Front should handle empty list.
    return {"dots": []}
