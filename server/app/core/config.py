from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database Configuration
    DATABASE_URL: str = "postgresql://portalops:password@localhost:5432/portalops"

    # JWT Configuration
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 180

    # Azure AD Configuration
    AZURE_AD_TENANT_ID: Optional[str] = None
    AZURE_AD_CLIENT_ID: Optional[str] = None
    AZURE_AD_ENABLED: bool = False  # Enable Azure AD authentication

    # API Configuration
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "PortalOps"

    # File Upload Configuration
    UPLOAD_DIR: str = "/uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB

    # HR Webhook Configuration
    HR_WEBHOOK_API_KEY: str = "your-hr-webhook-secret-key"

    # Email Configuration
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    FROM_EMAIL: str = "noreply@portalops.com"

    # Development Configuration
    DEBUG: bool = True

    # Scheduler Configuration
    # Payment expiration check schedule (default: daily at 00:01)
    PAYMENT_EXPIRATION_CHECK_HOUR: int = 0
    PAYMENT_EXPIRATION_CHECK_MINUTE: int = 1

    # Task reminder schedule (default: Monday at 10:00)
    TASK_REMINDER_DAY_OF_WEEK: int = 0  # Monday = 0, Sunday = 6
    TASK_REMINDER_HOUR: int = 10
    TASK_REMINDER_MINUTE: int = 0

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
