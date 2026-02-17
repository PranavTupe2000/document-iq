from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):

    # Kafka
    kafka_bootstrap_servers: str

    # Redis
    redis_host: str
    redis_port: int

    # MLflow
    mlflow_tracking_uri: Optional[str] = None
    mlflow_tracking_username: Optional[str] = None
    mlflow_tracking_password: Optional[str] = None

    # OCR Provider
    ocr_provider:str = "mock"

    # Azure OCR
    azure_ocr_endpoint: Optional[str] = None
    azure_ocr_key: Optional[str] = None
    
    # OCR Space
    ocr_space_api_key: Optional[str] = None
    
    # ENV
    env: str = "dev"  # default
    
    # RAG
    rag_llm_provider: Optional[str] = None
    chroma_persist_dir: Optional[str] = None
    
    groq_api_key: Optional[str] = None
    groq_model: Optional[str] = None
    
    huggingface_embedding_model: Optional[str] = None
    
    # SQL DB
    database_url: Optional[str] = None
    jwt_secret: Optional[str] = None
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    
    # Component URIs
    account_url: Optional[str] = None
    application_url: Optional[str] = None

    class Config:
        env_prefix = "DOCUMENT_IQ_"
        env_file = ".env"
        extra = "ignore"
