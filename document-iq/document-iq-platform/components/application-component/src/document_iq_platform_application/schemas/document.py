from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    group_id: int
    file_name: str
    content_base64: str


class AnalyzeResponse(BaseModel):
    document_id: int
    status: str
