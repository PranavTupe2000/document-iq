from pydantic import BaseModel


class DocumentAnalyzeRequest(BaseModel):
    document_id: str
    file_name: str
    content_base64: str


class DocumentAnalyzeResponse(BaseModel):
    request_id: str
    document_id: str
    status: str
