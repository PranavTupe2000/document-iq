from fastapi import APIRouter, Depends, HTTPException
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

router = APIRouter(prefix="/documents", tags=["Documents"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_document(
    request: AnalyzeRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = Document(
        organization_id=current_user["org_id"],
        group_id=request.group_id,
        file_name=request.file_name,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    job = ProcessingJob(
        document_id=document.id,
        status="pending",
    )

    db.add(job)
    db.commit()

    publish_ingestion_event(
        {
            "request_id": f"doc_{document.id}",
            "document_id": document.id,
            "file_name": request.file_name,
            "content_base64": request.content_base64,
            "organization_id": current_user["org_id"],
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

    return {
        "document_id": document_id,
        "status": job.status,
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
