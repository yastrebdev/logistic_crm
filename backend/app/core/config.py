from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./app.db"

    seed_admin_email: str | None = None
    seed_admin_password: str | None = None

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"

    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    refresh_cookie_secure: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()