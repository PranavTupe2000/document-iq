from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from document_iq_platform_application.database.session import SessionLocal
from document_iq_platform_account.security.dependencies import get_current_user
from document_iq_platform_application.services.query_service import query_group

router = APIRouter(prefix="/groups", tags=["Group Query"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/{group_id}/query")
def group_query(
    group_id: int,
    question: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return query_group(
        db=db,
        user=current_user,
        group_id=group_id,
        question=question["query"],
    )
