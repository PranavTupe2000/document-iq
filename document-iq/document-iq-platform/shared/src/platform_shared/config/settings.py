from pydantic import BaseSettings


class Settings(BaseSettings):
    kafka_bootstrap_servers: str = "kafka:9092"

    class Config:
        env_prefix = "DOCUMENT_IQ_"
