from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from pydantic import AnyUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "K-Phishing Hunterz API"
    API_V1_PREFIX: str = "/api/v1"

    APP_PORT: int = 8700
    DATABASE_URL: str

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRES_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRES_DAYS: int = 14

    CORS_ALLOW_ORIGINS: str = "http://localhost:3700,https://kph.pjcloud.store"

    REDIS_URL: str | None = None

    DEMO_IDENTITY_VERIFICATION: bool = True
    DEMO_IDENTITY_CODE: str = "000000"

    APP_AUTO_INIT: bool = False

    DOMAIN: str = "kph.pjcloud.store"

    @property
    def cors_allow_origins_list(self) -> list[str]:
        raw = self.CORS_ALLOW_ORIGINS.strip()
        if not raw:
            return []
        return [item.strip() for item in raw.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


SettingsDep = Annotated[Settings, get_settings]
