from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import CurrentUserDep
from app.db.session import get_db
from app.models.identity_verification import IdentityVerification
from app.models.oath_document import OathDocument
from app.models.oath_signature import OathSignature
from app.models.test import Test
from app.models.test_attempt import TestAttempt
from app.models.test_question import TestQuestion
from app.models.training_module import TrainingModule
from app.models.training_progress import TrainingProgress
from app.services.onboarding import get_onboarding_status, require_hunter_verified


router = APIRouter(tags=["onboarding"])


@router.get("/onboarding/status")
def onboarding_status(
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    return get_onboarding_status(db, current)


class IdentityVerifyRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    birthdate: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    phone: str = Field(min_length=7, max_length=20)
    demo_code: str | None = None


@router.post("/onboarding/identity/verify")
def identity_verify(
    body: IdentityVerifyRequest,
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    settings = get_settings()
    if not settings.DEMO_IDENTITY_VERIFICATION:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Identity verification not configured")

    code = body.demo_code or ""
    if code != settings.DEMO_IDENTITY_CODE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid demo code")

    existing = db.scalar(select(IdentityVerification).where(IdentityVerification.user_id == current.id))
    now = datetime.now(timezone.utc)
    if existing:
        existing.provider = "DEMO"
        existing.status = "VERIFIED"
        existing.verified_at = now
        db.add(existing)
    else:
        db.add(
            IdentityVerification(
                user_id=current.id,
                provider="DEMO",
                provider_tx_id=str(uuid.uuid4()),
                status="VERIFIED",
                verified_at=now,
            )
        )
    db.commit()
    return {"verified": True, "provider": "DEMO", "verified_at": now}


class TrainingModuleResponse(BaseModel):
    id: uuid.UUID
    title: str
    duration_seconds: int
    watched_seconds: int = 0
    completed_at: datetime | None = None


@router.get("/training/modules", response_model=list[TrainingModuleResponse])
def get_training_modules(
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    modules = db.scalars(select(TrainingModule).where(TrainingModule.is_active == True).order_by(TrainingModule.created_at.asc())).all()  # noqa: E712
    progress_map = {
        (p.module_id): p
        for p in db.scalars(select(TrainingProgress).where(TrainingProgress.user_id == current.id)).all()
    }
    return [
        TrainingModuleResponse(
            id=m.id,
            title=m.title,
            duration_seconds=m.duration_seconds,
            watched_seconds=progress_map.get(m.id).watched_seconds if progress_map.get(m.id) else 0,
            completed_at=progress_map.get(m.id).completed_at if progress_map.get(m.id) else None,
        )
        for m in modules
    ]


class TrainingProgressRequest(BaseModel):
    module_id: uuid.UUID
    watched_seconds: int = Field(ge=0)


@router.post("/training/progress")
def post_training_progress(
    body: TrainingProgressRequest,
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    module = db.get(TrainingModule, body.module_id)
    if not module or not module.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    watched = min(body.watched_seconds, module.duration_seconds)
    progress = db.get(TrainingProgress, {"user_id": current.id, "module_id": module.id})
    now = datetime.now(timezone.utc)
    if progress:
        progress.watched_seconds = max(progress.watched_seconds, watched)
        if progress.watched_seconds >= module.duration_seconds and progress.completed_at is None:
            progress.completed_at = now
        progress.updated_at = now
        db.add(progress)
    else:
        db.add(
            TrainingProgress(
                user_id=current.id,
                module_id=module.id,
                watched_seconds=watched,
                completed_at=now if watched >= module.duration_seconds else None,
                updated_at=now,
            )
        )
    db.commit()
    return {"ok": True}


@router.post("/training/complete")
def training_complete(
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    modules = db.scalars(select(TrainingModule.id).where(TrainingModule.is_active == True)).all()  # noqa: E712
    if not modules:
        return {"ok": True}
    completed = db.scalar(
        select(func.count())
        .select_from(TrainingProgress)
        .where(
            TrainingProgress.user_id == current.id,
            TrainingProgress.module_id.in_(modules),
            TrainingProgress.completed_at.is_not(None),
        )
    ) or 0
    if completed != len(modules):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Training not completed")
    return {"ok": True}


class TestQuestionOut(BaseModel):
    id: uuid.UUID
    question_text: str
    options: list[str]


class TestOut(BaseModel):
    id: uuid.UUID
    code: str
    title: str
    questions: list[TestQuestionOut]


@router.get("/tests/hunter-qualification", response_model=TestOut)
def get_hunter_test(
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    test = db.scalar(select(Test).where(Test.code == "hunter-qualification", Test.is_active == True))  # noqa: E712
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found")
    questions = db.scalars(select(TestQuestion).where(TestQuestion.test_id == test.id).order_by(TestQuestion.created_at.asc())).all()
    return TestOut(
        id=test.id,
        code=test.code,
        title=test.title,
        questions=[TestQuestionOut(id=q.id, question_text=q.question_text, options=q.options) for q in questions],
    )


class TestAnswer(BaseModel):
    question_id: uuid.UUID
    chosen_index: int = Field(ge=0)


class TestSubmitRequest(BaseModel):
    test_id: uuid.UUID
    answers: list[TestAnswer]


@router.post("/tests/submit")
def submit_test(
    body: TestSubmitRequest,
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    test = db.get(Test, body.test_id)
    if not test or not test.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found")
    questions = db.scalars(select(TestQuestion).where(TestQuestion.test_id == test.id)).all()
    qmap = {q.id: q for q in questions}
    correct = 0
    total = len(questions)
    for ans in body.answers:
        q = qmap.get(ans.question_id)
        if not q:
            continue
        if ans.chosen_index == q.correct_index:
            correct += 1
    score = int(round((correct / total) * 100)) if total else 0
    passed = score >= 80
    attempt = TestAttempt(user_id=current.id, test_id=test.id, score=score, passed=passed)
    db.add(attempt)
    db.commit()
    return {"score": score, "passed": passed}


class OathOut(BaseModel):
    id: uuid.UUID
    version: int
    content_md: str
    published_at: datetime


@router.get("/oaths/current", response_model=OathOut)
def get_oath(
    db: Annotated[Session, Depends(get_db)],
):
    doc = db.scalar(select(OathDocument).order_by(OathDocument.published_at.desc()))
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oath not found")
    return OathOut(id=doc.id, version=doc.version, content_md=doc.content_md, published_at=doc.published_at)


class OathSignRequest(BaseModel):
    doc_id: uuid.UUID
    signature_blob: str = Field(min_length=1)


@router.post("/oaths/sign")
def sign_oath(
    body: OathSignRequest,
    request: Request,
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    doc = db.get(OathDocument, body.doc_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oath not found")
    sig = OathSignature(
        user_id=current.id,
        doc_id=doc.id,
        signature_blob=body.signature_blob,
        ip=(request.client.host if request.client else None),
    )
    db.add(sig)
    db.commit()
    return {"ok": True}


@router.get("/hunters/certificate")
def hunter_certificate(
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    try:
        require_hunter_verified(db, current)
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hunter not verified")

    # Lazy import to avoid circular
    from app.models.hunter_profile import HunterProfile

    profile = db.get(HunterProfile, current.id)
    return {
        "hunter_number": profile.hunter_number if profile else None,
        "level": profile.level if profile else None,
        "issued_at": profile.verified_at if profile else None,
        "card_title": "명예 케피헌 자격증",
    }
