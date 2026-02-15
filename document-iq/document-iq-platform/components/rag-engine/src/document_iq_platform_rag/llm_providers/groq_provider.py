import os
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage

from document_iq_platform_rag.schemas.rag_response import RAGResponse
from document_iq_platform_rag.llm_providers.base import LLMProvider
from platform_shared.config.settings import Settings

settings = Settings()

class GroqProvider(LLMProvider):
    def __init__(self):
        base_llm = ChatGroq(
            groq_api_key=settings.groq_api_key,
            model=settings.groq_model,
            temperature=0.1,
        )

        self.llm = base_llm.with_structured_output(RAGResponse)

    def generate(self, prompt: str) -> dict:
        response = self.llm.invoke(prompt)
        return response.dict()
