from __future__ import annotations

import os

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.services.bootstrap import create_tables, seed_data


def main() -> None:
    auto_init = os.getenv("APP_AUTO_INIT", "").lower() in ("1", "true", "yes")
    if auto_init:
        # Server startup can auto-init; this script is for manual init.
        pass

    create_tables()
    db: Session = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()
    print("✅ DB initialized (tables created + seed data inserted).")


if __name__ == "__main__":
    main()

