from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    kafka_bootstrap_servers: str = "kafka:9092"
    redis_host: str = "redis"
    redis_port: int = 6379

    class Config:
        env_prefix = "DOCUMENT_IQ_"
