import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from document_iq_platform_application.database.session import SessionLocal
from document_iq_platform_application.models.document import Document
from document_iq_platform_application.security.dependencies import get_current_user

router = APIRouter(prefix="/documents", tags=["Document CRUD"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------------------------------------
# GET Document By ID
# -------------------------------------------------
@router.get("/{document_id}")
def get_document(
    document_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.organization_id == current_user["org_id"]
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return document


# -------------------------------------------------
# LIST Documents By Group
# -------------------------------------------------
@router.get("/group/{group_id}")
def list_documents_by_group(
    group_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    documents = db.query(Document).filter(
        Document.group_id == group_id,
        Document.organization_id == current_user["org_id"]
    ).all()

    return documents


# -------------------------------------------------
# DELETE Document
# -------------------------------------------------
@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.organization_id == current_user["org_id"]
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete physical file
    if os.path.exists(document.file_path):
        os.remove(document.file_path)

    db.delete(document)
    db.commit()

    return {"message": "Document deleted successfully"}


# -------------------------------------------------
# DOWNLOAD Original Document
# -------------------------------------------------
@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.organization_id == current_user["org_id"]
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=document.file_path,
        filename=document.file_name,
        media_type="application/octet-stream",
    )
