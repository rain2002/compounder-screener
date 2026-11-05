from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Optional
from pathlib import Path

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/compounder_screener"
    environment: str = "development"
    cors_origins: str = "http://localhost:5173"
    fx_api_url: str = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/latest/currencies/usd.json"
    finnhub_api_key: Optional[str] = None
    watchlist_upload_dir: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH) if ENV_PATH.exists() else ".env",
        extra="ignore"
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
