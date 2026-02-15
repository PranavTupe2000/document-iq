import base64
import uuid
from datetime import datetime
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from document_iq_ui_bff.schemas.document import (
    DocumentAnalyzeResponse,
)
from document_iq_ui_bff.kafka.producer import EventProducer
from platform_shared.config.settings import Settings
from platform_shared.storage.redis_client import get_redis_client


router = APIRouter()
settings = Settings()
producer = EventProducer(brokers=settings.kafka_bootstrap_servers)
redis_client = get_redis_client()


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

@router.get("/document/{request_id}/status")
def get_document_status(request_id: str):
    key = f"workflow:{request_id}"
    data = redis_client.hgetall(key)

    if not data:
        raise HTTPException(status_code=404, detail="Request not found")

    return {
        "request_id": request_id,
        "current_stage": data.get("current_stage", "unknown"),
        "overall_status": data.get("overall_status", "processing"),
    }

@router.get("/document/{request_id}/result")
def get_document_result(request_id: str):
    key = f"workflow:{request_id}"
    data = redis_client.hgetall(key)

    if not data:
        raise HTTPException(status_code=404, detail="Request not found")

    if data.get("overall_status") != "completed":
        return {
            "request_id": request_id,
            "status": "processing",
            "current_stage": data.get("current_stage"),
        }

    return {
        "request_id": request_id,
        "classification": data.get("classification_result"),
        "layout": data.get("layout_result"),
        "rag": data.get("rag_response"),
    }
