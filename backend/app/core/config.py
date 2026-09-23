from pydantic_settings import BaseSettings
from functools import lru_cache
from pydantic import field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "Kloset"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str = "postgresql+asyncpg://kloset:kloset@localhost:5432/kloset"

    SECRET_KEY: str = "change-this-to-a-strong-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    OPENWEATHER_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def ensure_asyncpg(cls, v: str) -> str:
        if not v:
            return v
        if v.startswith("postgresql://") and "+asyncpg" not in v:
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        if "ssl" not in v.lower() and "localhost" not in v and "127.0.0.1" not in v:
            sep = "&" if "?" in v else "?"
            v = f"{v}{sep}ssl=require"
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
