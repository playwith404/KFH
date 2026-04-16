from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


def import_models() -> None:
    # Imported for side effects (model registration)
    from app import models  # noqa: F401

