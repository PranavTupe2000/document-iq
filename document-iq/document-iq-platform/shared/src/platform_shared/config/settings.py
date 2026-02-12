from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    kafka_bootstrap_servers: str
    redis_host: str
    redis_port: int

    class Config:
        env_prefix = "DOCUMENT_IQ_"
        env_file = ".env"