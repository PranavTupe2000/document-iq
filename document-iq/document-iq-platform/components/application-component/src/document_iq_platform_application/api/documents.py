import base64
from datetime import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from document_iq_platform_application.database.session import SessionLocal
from document_iq_platform_application.models.document import Document
from document_iq_platform_application.models.processing_job import ProcessingJob
from document_iq_platform_application.schemas.document import (
    AnalyzeRequest,
    AnalyzeResponse,
)
from document_iq_platform_application.security.dependencies import (
    get_current_user,
)
from document_iq_platform_application.messaging.producer import (
    publish_ingestion_event,
)
from platform_shared.config.settings import Settings
from platform_shared.storage.redis_client import get_redis_client

redis_client = get_redis_client()
import os

settings = Settings()
UPLOAD_DIR = settings.uploaded_file_path
router = APIRouter(prefix="/documents", tags=["Documents"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_document(
    group_id: int = Form(...),
    image: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1️⃣ Validate file type
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported")

    # 2️⃣ Read file content
    content = await image.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")

    content_base64 = base64.b64encode(content).decode("utf-8")

    # Store file physically
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    file_extension = image.filename.split(".")[-1]
    file_name = f"{uuid.uuid4().hex}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    with open(file_path, "wb") as f:
        f.write(content)
    
    # 3️⃣ Create document record
    document = Document(
        organization_id=current_user["org_id"],
        group_id=group_id,
        file_name=image.filename,
        file_path=file_path,
        status="processing",
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # 4️⃣ Create processing job
    job = ProcessingJob(
        document_id=document.id,
        status="pending",
    )

    db.add(job)
    db.commit()

    # 5️⃣ Publish ingestion event
    publish_ingestion_event(
        {
            "request_id": f"doc_{document.id}",
            "document_id": document.id,
            "file_name": document.file_name,
            "content_base64": content_base64,
            "organization_id": current_user["org_id"],
            "group_id": group_id,
            "requested_at": datetime.utcnow().isoformat(),
        }
    )

    return AnalyzeResponse(
        document_id=document.id,
        status="pending",
    )


@router.get("/{document_id}/status")
def get_document_status(document_id: int, db: Session = Depends(get_db)):

    job = (
        db.query(ProcessingJob)
        .filter(ProcessingJob.document_id == document_id)
        .first()
    )

    if not job:
        raise HTTPException(status_code=404, detail="Processing job not found")

    request_id = f"doc_{document_id}"
    workflow_key = f"workflow:{request_id}"

    workflow = redis_client.hgetall(workflow_key)

    if not workflow:
        return {
            "document_id": document_id,
            "overall_status": job.status,
            "stages": {}
        }

    stages = {
        "ingestion": workflow.get("ingestion_status", "pending"),
        "ocr": workflow.get("ocr_status", "pending"),
        "classification": workflow.get("classification_status", "pending"),
        "layout": workflow.get("layout_status", "pending"),
        "rag": workflow.get("rag_status", "pending"),
    }

    # Determine overall status dynamically
    if all(status == "completed" for status in stages.values()):
        overall_status = "completed"
    elif any(status == "completed" for status in stages.values()):
        overall_status = "processing"
    else:
        overall_status = "pending"

    return {
        "document_id": document_id,
        "overall_status": overall_status,
        "stages": stages,
    }

@router.get("/{document_id}/result")
def get_document_result(document_id: int, db: Session = Depends(get_db)):
    document = (
        db.query(Document)
        .filter(Document.id == document_id)
        .first()
    )

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if not document.rag_result:
        return {"status": "processing"}

    return {
        "document_id": document_id,
        "classification": document.classification,
        "layout_result": document.layout_result,
        "rag_result": document.rag_result,
    }
