from typing import List, Optional

from pydantic import BaseModel, Field


class RAGResponse(BaseModel):
    answer: Optional[str] = None
    summary: Optional[str] = None
    key_insights: List[str] = Field(default_factory=list)
    document_type: Optional[str] = None
    confidence: Optional[float] = None
