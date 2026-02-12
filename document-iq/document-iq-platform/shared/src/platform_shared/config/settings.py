from pydantic_settings import BaseSettings

class Settings(BaseSettings):

    # Kafka
    kafka_bootstrap_servers: str

    # Redis
    redis_host: str
    redis_port: int

    # MLflow
    mlflow_tracking_uri: str
    mlflow_tracking_username: str
    mlflow_tracking_password: str

    class Config:
        env_prefix = "DOCUMENT_IQ_"
        env_file = ".env"