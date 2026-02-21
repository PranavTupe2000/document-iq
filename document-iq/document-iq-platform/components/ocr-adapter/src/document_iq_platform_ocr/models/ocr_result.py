from typing import List, Optional
from pydantic import BaseModel


class OCRWord(BaseModel):
    text: str
    bbox: List[int]  # [x0, y0, x1, y1]
    page: int


class OCRPage(BaseModel):
    page: int
    lines: List[str]


class OCRResult(BaseModel):
    pages: List[OCRPage]
    words: Optional[List[OCRWord]] = None