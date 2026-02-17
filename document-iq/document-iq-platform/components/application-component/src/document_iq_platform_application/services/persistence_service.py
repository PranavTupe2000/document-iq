from sqlalchemy.orm import Session
from document_iq_platform_application.database.session import SessionLocal
from document_iq_platform_application.models.document import Document
from document_iq_platform_application.models.processing_job import ProcessingJob


def persist_processing_result(event: dict):
    db: Session = SessionLocal()

    document = db.query(Document).filter(
        Document.id == event["document_id"]
    ).first()

    if document:
        document.classification = event["classification"]
        document.layout_result = event["layout_result"]
        document.rag_result = event["rag_result"]

        job = db.query(ProcessingJob).filter(
            ProcessingJob.document_id == event["document_id"]
        ).first()

        if job:
            job.status = "completed"

        db.commit()

    db.close()
