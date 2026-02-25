import json
import re
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

        # Structured mode (for summary layer)
        self.structured_llm = base_llm.with_structured_output(
            RAGResponse,
            method="json_mode"
        )

        # Raw JSON mode (for entity extraction layer)
        self.raw_llm = base_llm

    def generate(self, prompt: str) -> dict:
        """
        Structured summary generation (validated)
        """
        response = self.structured_llm.invoke(prompt)

        if isinstance(response, RAGResponse):
            return response.model_dump(exclude_none=True)

        if isinstance(response, dict):
            try:
                return RAGResponse(**response).model_dump(exclude_none=True)
            except ValidationError as exc:
                raise ValueError(
                    f"Invalid structured response from LLM: {exc}"
                ) from exc

        raise ValueError(
            f"Unexpected LLM response type: {type(response).__name__}"
        )

    def generate_raw_json(self, prompt: str) -> dict:
        response = self.raw_llm.invoke(prompt)

        if hasattr(response, "content"):
            text = response.content
        else:
            text = str(response)

        # -----------------------------------------
        # 1️⃣ Try to extract JSON inside ```json block
        # -----------------------------------------
        code_block_match = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
        if code_block_match:
            json_str = code_block_match.group(1)
        else:
            # -----------------------------------------
            # 2️⃣ Try to extract first JSON object
            # -----------------------------------------
            brace_match = re.search(r"\{.*\}", text, re.DOTALL)
            if brace_match:
                json_str = brace_match.group(0)
            else:
                return {}

        try:
            return json.loads(json_str)
        except Exception:
            return {}