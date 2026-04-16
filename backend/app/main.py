from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.api.routers.analytics import router as analytics_router
from app.api.routers.auth import router as auth_router
from app.api.routers.baits import router as baits_router
from app.api.routers.console import router as console_router
from app.api.routers.hunt import router as hunt_router
from app.api.routers.misc import router as misc_router
from app.api.routers.notifications import router as notifications_router
from app.api.routers.onboarding import router as onboarding_router
from app.api.routers.points import router as points_router
from app.api.routers.ranking import router as ranking_router
from app.api.routers.reports import router as reports_router
from app.api.routers.rewards import router as rewards_router
from app.core.config import get_settings
from app.core.security import decode_access_token
from app.db.session import SessionLocal, get_db
from app.models.bait import Bait
from app.models.enums import UserRole
from app.models.hunt_session import HuntSession
from app.models.user import User
from app.services.bootstrap import create_tables, seed_data
from app.websocket.manager import manager


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.APP_NAME, openapi_url=f"{settings.API_V1_PREFIX}/openapi.json")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allow_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
    app.include_router(onboarding_router, prefix=settings.API_V1_PREFIX)
    app.include_router(baits_router, prefix=settings.API_V1_PREFIX)
    app.include_router(hunt_router, prefix=settings.API_V1_PREFIX)
    app.include_router(reports_router, prefix=settings.API_V1_PREFIX)
    app.include_router(points_router, prefix=settings.API_V1_PREFIX)
    app.include_router(rewards_router, prefix=settings.API_V1_PREFIX)
    app.include_router(ranking_router, prefix=settings.API_V1_PREFIX)
    app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
    app.include_router(notifications_router, prefix=settings.API_V1_PREFIX)
    app.include_router(console_router, prefix=settings.API_V1_PREFIX)
    app.include_router(misc_router, prefix=settings.API_V1_PREFIX)

    @app.get("/healthz")
    def healthz():
        return {"ok": True, "ts": datetime.now(timezone.utc).isoformat()}

    @app.get("/readyz")
    def readyz():
        return {"ok": True}

    @app.on_event("startup")
    def _startup():
        if settings.APP_AUTO_INIT:
            create_tables()
            db = SessionLocal()
            seed_data(db)
            db.close()

    @app.websocket("/ws/hunt/sessions/{session_id}")
    async def ws_hunt_session(websocket: WebSocket, session_id: uuid.UUID, db: Session = Depends(get_db)):
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=1008)
            return
        try:
            payload = decode_access_token(token)
        except Exception:
            await websocket.close(code=1008)
            return

        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008)
            return
        try:
            user_uuid = uuid.UUID(str(user_id))
        except ValueError:
            await websocket.close(code=1008)
            return
        user = db.get(User, user_uuid)
        if not user:
            await websocket.close(code=1008)
            return

        session = db.get(HuntSession, session_id)
        if not session:
            await websocket.close(code=1008)
            return

        if user.role not in (UserRole.ADMIN, UserRole.POLICE):
            bait = db.get(Bait, session.bait_id)
            if not bait or bait.issued_to_user_id != user.id:
                await websocket.close(code=1008)
                return

        await manager.connect(session_id, websocket)
        try:
            while True:
                # keep connection alive; client can optionally send ping
                await websocket.receive_text()
        except WebSocketDisconnect:
            await manager.disconnect(session_id, websocket)

    return app


app = create_app()
