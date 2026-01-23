from pydantic import BaseModel


class DocumentPayload(BaseModel):
    document_id: str
    file_name: str
    content_base64: str
