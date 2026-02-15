from typing import List
from pydantic import BaseModel, Field


class OCRPage(BaseModel):
    page: int = Field(..., ge=1)
    lines: List[str]


class OCRResult(BaseModel):
    pages: List[OCRPage]
