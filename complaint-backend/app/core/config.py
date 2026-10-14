from pydantic_settings import BaseSettings
from pydantic import field_validator

class Settings(BaseSettings):
    groq_api_key: str
    database_url: str
    cors_origins: str = "http://localhost:5173"

    @field_validator("database_url")
    @classmethod
    def normalize_db_url(cls, v):
        return v.replace("postgres://", "postgresql://", 1) if v.startswith("postgres://") else v

    class Config:
        env_file = ".env"

settings = Settings()