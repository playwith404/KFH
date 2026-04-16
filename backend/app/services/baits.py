from __future__ import annotations

import random
import string
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.bait import Bait
from app.models.bait_deployment import BaitDeployment
from app.models.bait_template import BaitTemplate
from app.models.enums import DeploymentPlatform, NotificationType
from app.services.notifications import create_notification
from app.services.points import add_points


def ensure_baits_for_user(db: Session, *, user_id: uuid.UUID) -> list[Bait]:
    existing = db.scalars(select(Bait).where(Bait.issued_to_user_id == user_id).order_by(Bait.created_at.desc())).all()
    if existing:
        return existing

    templates = db.scalars(select(BaitTemplate).where(BaitTemplate.is_active == True)).all()  # noqa: E712
    baits: list[Bait] = []
    for tpl in templates:
        phone = _generate_virtual_phone()
        messenger_id = _generate_messenger_id()
        rendered = tpl.body_template.format(phone=phone, messenger_id=messenger_id)
        bait = Bait(
            template_id=tpl.id,
            issued_to_user_id=user_id,
            virtual_phone=phone,
            virtual_messenger_id=messenger_id,
            rendered_body=rendered,
        )
        db.add(bait)
        baits.append(bait)
    db.commit()
    return db.scalars(select(Bait).where(Bait.issued_to_user_id == user_id)).all()


def _generate_virtual_phone() -> str:
    # MVP: virtual-looking number pattern
    return f"070-{random.randint(1000,9999)}-{random.randint(1000,9999)}"


def _generate_messenger_id() -> str:
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"kph_{suffix}"


def can_deploy_more_today(db: Session, *, user_id: uuid.UUID, max_per_day: int = 5) -> bool:
    now = datetime.now(timezone.utc)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    count = db.scalar(
        select(func.count())
        .select_from(BaitDeployment)
        .where(BaitDeployment.user_id == user_id, BaitDeployment.deployed_at >= start)
    ) or 0
    return count < max_per_day


def deployment_platform_limit_ok(
    db: Session,
    *,
    user_id: uuid.UUID,
    platform: DeploymentPlatform,
    max_per_24h: int = 3,
) -> bool:
    now = datetime.now(timezone.utc)
    since = now - timedelta(hours=24)
    count = db.scalar(
        select(func.count())
        .select_from(BaitDeployment)
        .where(
            BaitDeployment.user_id == user_id,
            BaitDeployment.platform == platform,
            BaitDeployment.deployed_at >= since,
        )
    ) or 0
    return count < max_per_24h


def create_deployment(
    db: Session,
    *,
    bait: Bait,
    user_id: uuid.UUID,
    platform: DeploymentPlatform,
    post_url: str | None,
    memo: str | None,
    max_per_day: int = 5,
    max_per_platform_24h: int = 3,
) -> BaitDeployment:
    if not can_deploy_more_today(db, user_id=user_id, max_per_day=max_per_day):
        raise ValueError("Daily deployment limit reached")
    if not deployment_platform_limit_ok(
        db, user_id=user_id, platform=platform, max_per_24h=max_per_platform_24h
    ):
        raise ValueError("Platform 24h limit reached")

    dep = BaitDeployment(
        bait_id=bait.id,
        user_id=user_id,
        platform=platform,
        post_url=post_url,
        memo=memo,
    )
    db.add(dep)
    db.commit()
    db.refresh(dep)

    # Points: +10P per deployment (idempotent by deployment id)
    add_points(
        db,
        user_id=user_id,
        delta=10,
        reason_code="BAIT_DEPLOYED",
        reference_type="bait_deployment",
        reference_id=str(dep.id),
    )

    create_notification(
        db,
        user_id=user_id,
        type=NotificationType.SYSTEM,
        title="미끼 배포 완료",
        body=f"{platform.value}에 배포했습니다. +10P",
        data={"bait_id": str(bait.id), "deployment_id": str(dep.id), "platform": platform.value},
    )
    return dep
