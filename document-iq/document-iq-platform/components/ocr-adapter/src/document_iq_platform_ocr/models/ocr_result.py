from typing import List, Optional
from pydantic import BaseModel, Field


class OCRWord(BaseModel):
    """
    Represents a single OCR-recognized word with bounding box.
    """
    text: str
    bbox: List[int] = Field(..., min_items=4, max_items=4)
    page: int


class OCRPage(BaseModel):
    """
    Represents one page of OCR results.
    """
    page: int
    lines: List[str]


class OCRResult(BaseModel):
    """
    Unified OCR output used across Document-IQ.
    """
    pages: List[OCRPage]
    words: Optional[List[OCRWord]] = None