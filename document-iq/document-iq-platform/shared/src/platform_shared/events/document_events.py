from pydantic import BaseModel
from datetime import datetime


class DocumentIngestionRequested(BaseModel):
    request_id: str
    document_id: str
    file_name: str
    content_base64: str
    requested_at: datetime
