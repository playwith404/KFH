from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    CurrentUserDep,
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.core.config import get_settings
from app.db.session import get_db
from app.models.auth_session import AuthSession
from app.models.enums import UserRole, UserStatus
from app.models.user import User
from app.services.onboarding import ensure_hunter_profile


router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class MeResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: UserRole
    status: UserStatus


class TokenResponse(BaseModel):
    access_token: str
    expires_in: int
    refresh_token: str | None = None
    me: MeResponse


def _get_client_ip(request: Request) -> str | None:
    # If behind reverse proxy, configure a proper proxy header strategy in production.
    return request.client.host if request.client else None


@router.post("/register", response_model=TokenResponse)
def register(
    body: RegisterRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
):
    existing = db.scalar(select(User).where(User.email == body.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        role=UserRole.HUNTER,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    ensure_hunter_profile(db, user)

    access_token, expires_in = create_access_token(user=user)
    refresh_token = create_refresh_token()
    refresh_hash = hash_refresh_token(refresh_token)
    settings = get_settings()
    session = AuthSession(
        user_id=user.id,
        refresh_token_hash=refresh_hash,
        ip=_get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRES_DAYS),
    )
    db.add(session)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        expires_in=expires_in,
        refresh_token=refresh_token,
        me=MeResponse(id=user.id, email=user.email, role=user.role, status=user.status),
    )


@router.post("/login", response_model=TokenResponse)
def login(
    body: LoginRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
):
    user = db.scalar(select(User).where(User.email == body.email))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")

    ensure_hunter_profile(db, user)

    access_token, expires_in = create_access_token(user=user)
    refresh_token = create_refresh_token()
    refresh_hash = hash_refresh_token(refresh_token)
    settings = get_settings()
    session = AuthSession(
        user_id=user.id,
        refresh_token_hash=refresh_hash,
        ip=_get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRES_DAYS),
    )
    db.add(session)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        expires_in=expires_in,
        refresh_token=refresh_token,
        me=MeResponse(id=user.id, email=user.email, role=user.role, status=user.status),
    )


@router.post("/refresh")
def refresh(
    body: RefreshRequest,
    db: Annotated[Session, Depends(get_db)],
):
    refresh_hash = hash_refresh_token(body.refresh_token)
    session = db.scalar(select(AuthSession).where(AuthSession.refresh_token_hash == refresh_hash))
    if not session or session.revoked_at is not None or session.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    user = db.get(User, session.user_id)
    if not user or user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")

    # Rotate refresh token (recommended)
    new_refresh = create_refresh_token()
    session.refresh_token_hash = hash_refresh_token(new_refresh)
    db.add(session)
    db.commit()

    access_token, expires_in = create_access_token(user=user)
    return {"access_token": access_token, "expires_in": expires_in, "refresh_token": new_refresh}


@router.post("/logout")
def logout(
    body: LogoutRequest,
    db: Annotated[Session, Depends(get_db)],
):
    refresh_hash = hash_refresh_token(body.refresh_token)
    session = db.scalar(select(AuthSession).where(AuthSession.refresh_token_hash == refresh_hash))
    if session and session.revoked_at is None:
        session.revoked_at = datetime.now(timezone.utc)
        db.add(session)
        db.commit()
    return {"ok": True}


@router.get("/me", response_model=MeResponse)
def me(current: CurrentUserDep):
    return MeResponse(id=current.id, email=current.email, role=current.role, status=current.status)


class SessionResponse(BaseModel):
    id: uuid.UUID
    ip: str | None
    user_agent: str | None
    created_at: datetime
    expires_at: datetime
    revoked_at: datetime | None


@router.get("/sessions", response_model=list[SessionResponse])
def list_sessions(
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    sessions = db.scalars(select(AuthSession).where(AuthSession.user_id == current.id).order_by(AuthSession.created_at.desc())).all()
    return [
        SessionResponse(
            id=s.id,
            ip=s.ip,
            user_agent=s.user_agent,
            created_at=s.created_at,
            expires_at=s.expires_at,
            revoked_at=s.revoked_at,
        )
        for s in sessions
    ]


@router.delete("/sessions/{session_id}")
def revoke_session(
    session_id: uuid.UUID,
    current: CurrentUserDep,
    db: Annotated[Session, Depends(get_db)],
):
    session = db.get(AuthSession, session_id)
    if not session or session.user_id != current.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    session.revoked_at = datetime.now(timezone.utc)
    db.add(session)
    db.commit()
    return {"ok": True}
