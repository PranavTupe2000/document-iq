import os
from document_iq_platform_rag.llm_providers.groq_provider import GroqProvider
from platform_shared.config.settings import Settings

settings = Settings()

def get_llm_provider():
    provider = settings.rag_llm_provider

    if provider == "groq":
        return GroqProvider()

    raise ValueError(f"Unsupported LLM provider: {provider}")
