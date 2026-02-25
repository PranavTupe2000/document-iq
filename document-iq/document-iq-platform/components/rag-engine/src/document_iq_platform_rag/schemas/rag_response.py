from typing import List, Optional
from pydantic import BaseModel, Field


class Entity(BaseModel):
    type: str
    label: Optional[str] = None
    value: str
    page: Optional[int] = 1
    confidence: Optional[float] = 0.7


class StructuredEntities(BaseModel):
    entities: List[Entity] = Field(default_factory=list)


class RAGResponse(BaseModel):
    answer: Optional[str] = None
    summary: Optional[str] = None
    key_insights: List[str] = Field(default_factory=list)
    document_type: Optional[str] = None
    confidence: Optional[float] = None
    structured_entities: StructuredEntities = Field(
        default_factory=StructuredEntities
    )