from pydantic import BaseModel
from datetime import datetime

class BaseResponse(BaseModel):
    request_id: str
    timestamp: datetime
