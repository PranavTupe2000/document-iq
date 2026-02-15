from pydantic import ValidationError
from langchain_groq import ChatGroq

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

        # Use JSON mode instead of function calling, which is less reliable on
        # some Groq model/tool combinations.
        self.llm = base_llm.with_structured_output(RAGResponse, method="json_mode")

    def generate(self, prompt: str) -> dict:
        response = self.llm.invoke(prompt)
        if isinstance(response, RAGResponse):
            return response.model_dump()
        if isinstance(response, dict):
            try:
                return RAGResponse(**response).model_dump()
            except ValidationError as exc:
                raise ValueError(f"Invalid structured response from LLM: {exc}") from exc
        raise ValueError(f"Unexpected LLM response type: {type(response).__name__}")
