from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class RAGResponse(BaseModel):
    answer: Optional[str] = None
    summary: Optional[str] = None
    key_insights: List[str] = Field(default_factory=list)
    document_type: Optional[str] = None
    confidence: Optional[float] = None

    @field_validator("answer", mode="before")
    @classmethod
    def coerce_answer_to_string(cls, value):
        if isinstance(value, list):
            return "\n".join(str(item) for item in value)
        return value
