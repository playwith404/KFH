from __future__ import annotations

import asyncio
import json
import uuid
from collections import defaultdict
from contextlib import suppress

from fastapi import WebSocket

from app.core.config import get_settings

try:
    import redis.asyncio as redis  # type: ignore
except Exception:  # pragma: no cover
    redis = None


class ConnectionManager:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._connections: dict[uuid.UUID, set[WebSocket]] = defaultdict(set)
        self._settings = get_settings()
        self._redis_url = self._settings.REDIS_URL
        self._redis = None
        self._starting: set[uuid.UUID] = set()
        self._pubsub_tasks: dict[uuid.UUID, asyncio.Task] = {}
        self._pubsubs: dict[uuid.UUID, object] = {}

    def _channel(self, session_id: uuid.UUID) -> str:
        return f"khp:ws:hunt:{session_id}"

    async def _get_redis(self):
        if not self._redis_url or redis is None:
            return None
        if self._redis is None:
            self._redis = redis.from_url(self._redis_url, decode_responses=True)
        return self._redis

    async def _start_subscription(self, session_id: uuid.UUID) -> None:
        r = await self._get_redis()
        if not r:
            async with self._lock:
                self._starting.discard(session_id)
            return
        pubsub = r.pubsub()
        channel = self._channel(session_id)
        try:
            await pubsub.subscribe(channel)
            task = asyncio.create_task(self._redis_listener(session_id, pubsub), name=f"khp-ws:{session_id}")
            async with self._lock:
                self._starting.discard(session_id)
                # Session may have been disconnected while setting up the subscription.
                if session_id not in self._connections:
                    task.cancel()
                    with suppress(Exception):
                        await pubsub.unsubscribe(channel)
                        await pubsub.close()
                    return
                self._pubsubs[session_id] = pubsub
                self._pubsub_tasks[session_id] = task
        except Exception:
            async with self._lock:
                self._starting.discard(session_id)
            with suppress(Exception):
                await pubsub.close()

    async def _stop_subscription(self, session_id: uuid.UUID) -> None:
        async with self._lock:
            self._starting.discard(session_id)
            task = self._pubsub_tasks.pop(session_id, None)
            pubsub = self._pubsubs.pop(session_id, None)
        if task:
            task.cancel()
            with suppress(Exception):
                await task
        if pubsub is not None:
            with suppress(Exception):
                await pubsub.unsubscribe(self._channel(session_id))
            with suppress(Exception):
                await pubsub.close()

    async def _redis_listener(self, session_id: uuid.UUID, pubsub) -> None:
        try:
            async for item in pubsub.listen():
                if not item or item.get("type") != "message":
                    continue
                data = item.get("data")
                if data is None:
                    continue
                if isinstance(data, bytes):
                    data = data.decode("utf-8", errors="ignore")
                await self._broadcast_local_raw(session_id, str(data))
        except asyncio.CancelledError:
            pass
        except Exception:
            # Best-effort; if Redis disconnects, local WS still works.
            pass

    async def connect(self, session_id: uuid.UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        start_sub = False
        async with self._lock:
            self._connections[session_id].add(websocket)
            if self._redis_url and session_id not in self._pubsub_tasks and session_id not in self._starting:
                self._starting.add(session_id)
                start_sub = True
        if start_sub:
            await self._start_subscription(session_id)

    async def disconnect(self, session_id: uuid.UUID, websocket: WebSocket) -> None:
        stop_sub = False
        async with self._lock:
            self._connections[session_id].discard(websocket)
            if not self._connections[session_id]:
                self._connections.pop(session_id, None)
                stop_sub = True
        if stop_sub:
            await self._stop_subscription(session_id)

    async def _broadcast_local_raw(self, session_id: uuid.UUID, data: str) -> None:
        async with self._lock:
            websockets = list(self._connections.get(session_id, set()))
        for ws in websockets:
            try:
                await ws.send_text(data)
            except Exception:
                # Best-effort; connection cleanup happens on next receive/disconnect
                pass

    async def broadcast(self, session_id: uuid.UUID, message: dict) -> None:
        data = json.dumps(message, ensure_ascii=False, default=str)
        r = await self._get_redis()
        if r:
            try:
                await r.publish(self._channel(session_id), data)
                return
            except Exception:
                # fall back to local broadcast
                pass
        await self._broadcast_local_raw(session_id, data)


manager = ConnectionManager()
