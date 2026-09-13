from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/compounder_screener"
    environment: str = "development"
    cors_origins: str = "http://localhost:5173"
    fx_api_url: str = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/latest/currencies/usd.json"

    class Config:
        env_file = ".env"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
