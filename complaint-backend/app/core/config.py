from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    groq_api_key: str
    database_url: str
    cors_origins: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

settings = Settings()