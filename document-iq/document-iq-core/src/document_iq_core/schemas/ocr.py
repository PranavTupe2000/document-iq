from pydantic import BaseModel
from typing import List

class OCRPage(BaseModel):
    page_number: int
    text: str
    confidence: float

class OCRResult(BaseModel):
    document_id: str
    pages: List[OCRPage]
    language: str
