from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import HunterLevel, UserRole
from app.models.hunter_profile import HunterProfile
from app.models.identity_verification import IdentityVerification
from app.models.oath_signature import OathSignature
from app.models.test import Test
from app.models.test_attempt import TestAttempt
from app.models.training_module import TrainingModule
from app.models.training_progress import TrainingProgress
from app.models.user import User


def ensure_hunter_profile(db: Session, user: User) -> HunterProfile | None:
    if user.role != UserRole.HUNTER:
        return None
    profile = db.get(HunterProfile, user.id)
    if profile:
        return profile
    hunter_number = _next_hunter_number(db)
    profile = HunterProfile(user_id=user.id, hunter_number=hunter_number, level=HunterLevel.TRAINEE)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def _next_hunter_number(db: Session) -> str:
    # MVP: not strictly sequential-safe across concurrent writers, but good enough for demo.
    count = db.scalar(select(func.count()).select_from(HunterProfile)) or 0
    return f"H{count + 1:06d}"


def get_onboarding_status(db: Session, user: User) -> dict:
    ensure_hunter_profile(db, user)

    identity_verified = bool(
        db.scalar(
            select(IdentityVerification.id).where(
                IdentityVerification.user_id == user.id, IdentityVerification.status == "VERIFIED"
            )
        )
    )

    active_modules = db.scalars(select(TrainingModule).where(TrainingModule.is_active == True)).all()  # noqa: E712
    if not active_modules:
        training_completed = True
    else:
        completed_count = db.scalar(
            select(func.count())
            .select_from(TrainingProgress)
            .where(
                TrainingProgress.user_id == user.id,
                TrainingProgress.module_id.in_([m.id for m in active_modules]),
                TrainingProgress.completed_at.is_not(None),
            )
        ) or 0
        training_completed = completed_count == len(active_modules)

    test = db.scalar(select(Test).where(Test.code == "hunter-qualification"))
    if not test:
        test_passed = True
    else:
        test_passed = bool(
            db.scalar(
                select(TestAttempt.id).where(
                    TestAttempt.user_id == user.id,
                    TestAttempt.test_id == test.id,
                    TestAttempt.passed == True,  # noqa: E712
                )
            )
        )

    oath_signed = bool(
        db.scalar(select(OathSignature.id).where(OathSignature.user_id == user.id))
    )

    hunter_verified = identity_verified and training_completed and test_passed and oath_signed
    profile = db.get(HunterProfile, user.id)
    if profile and hunter_verified and profile.verified_at is None:
        profile.verified_at = datetime.now(timezone.utc)
        profile.last_active_at = datetime.now(timezone.utc)
        db.add(profile)
        db.commit()

    return {
        "identity_verified": identity_verified,
        "training_completed": training_completed,
        "test_passed": test_passed,
        "oath_signed": oath_signed,
        "hunter_verified": hunter_verified,
        "hunter_level": profile.level if profile else None,
    }


def require_hunter_verified(db: Session, user: User) -> None:
    status = get_onboarding_status(db, user)
    if not status["hunter_verified"]:
        raise PermissionError("Hunter not verified")
