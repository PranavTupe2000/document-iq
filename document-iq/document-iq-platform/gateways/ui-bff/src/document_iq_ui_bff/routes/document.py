import base64
import uuid
from datetime import datetime
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from document_iq_ui_bff.schemas.document import (
    DocumentAnalyzeResponse,
)
from document_iq_ui_bff.kafka.producer import EventProducer
from platform_shared.config.settings import Settings

router = APIRouter()
settings = Settings()
producer = EventProducer(brokers=settings.kafka_bootstrap_servers)


@router.post(
    "/analyze",
    response_model=DocumentAnalyzeResponse
)
async def analyze_document(
    document_id: str = Form(...),
    image: UploadFile = File(...),
):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported")

    content = await image.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")

    request_id = f"req_{uuid.uuid4().hex}"
    content_base64 = base64.b64encode(content).decode("utf-8")

    event = {
        "request_id": request_id,
        "document_id": document_id,
        "file_name": image.filename or f"{document_id}.img",
        "content_base64": content_base64,
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
