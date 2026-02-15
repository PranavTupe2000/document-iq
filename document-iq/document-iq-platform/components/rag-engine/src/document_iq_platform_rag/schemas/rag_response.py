from pydantic import BaseModel
from typing import List


class RAGResponse(BaseModel):
    summary: str
    key_insights: List[str]
    document_type: str
    confidence: float
