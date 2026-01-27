import uuid
from datetime import datetime
from fastapi import APIRouter

from document_iq_ui_bff.schemas.document import (
    DocumentAnalyzeRequest,
    DocumentAnalyzeResponse,
)
from document_iq_ui_bff.kafka.producer import EventProducer

router = APIRouter()

producer = EventProducer(brokers="kafka:9092")


@router.post(
    "/analyze",
    response_model=DocumentAnalyzeResponse
)
def analyze_document(request: DocumentAnalyzeRequest):
    request_id = f"req_{uuid.uuid4().hex}"

    event = {
        "request_id": request_id,
        "document_id": request.document_id,
        "file_name": request.file_name,
        "content_base64": request.content_base64,
        "requested_at": datetime.utcnow().isoformat(),
    }

    producer.publish(
        topic="document.ingestion.requested",
        event=event,
    )

    return DocumentAnalyzeResponse(
        request_id=request_id,
        status="accepted",
    )
