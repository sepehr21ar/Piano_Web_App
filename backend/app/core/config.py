from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Piano Learning App"
    environment: str = "development"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/piano_app"
    secret_key: str = "CHANGE_ME"
    access_token_expire_minutes: int = 30   
    refresh_token_expire_days: int = 7
    storage_path: str = "./storage"
    allowed_origins: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()
