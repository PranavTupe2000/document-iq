from pydantic import BaseModel
from typing import List

class RAGResponse(BaseModel):
    answer: str
    sources: List[str]
    confidence: float
