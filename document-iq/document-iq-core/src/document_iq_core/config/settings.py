from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MLFLOW_TRACKING_URI: str
    AZURE_OCR_KEY: str | None = None

    class Config:
        env_file = ".env"
