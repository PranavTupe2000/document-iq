from pydantic import BaseModel
from typing import List

class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int

class LayoutBlock(BaseModel):
    type: str
    bbox: BoundingBox

class DLInferenceOutput(BaseModel):
    document_id: str
    blocks: List[LayoutBlock]
    model_version: str
