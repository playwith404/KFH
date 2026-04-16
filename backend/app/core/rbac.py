from __future__ import annotations

from collections.abc import Callable
from enum import Enum
from typing import Any

from fastapi import HTTPException, status

from app.core.security import CurrentUserDep
from app.models.user import User


def require_role(allowed: set[Any]) -> Callable[[User], User]:
    def _dep(user: CurrentUserDep) -> User:
        allowed_values = {
            a.value if isinstance(a, Enum) else str(a)
            for a in allowed
        }
        if user.role.value not in allowed_values:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user

    return _dep
