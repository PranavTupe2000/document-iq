from fastapi import APIRouter, Depends
from pydantic import BaseModel
from document_iq_platform_application.security.dependencies import get_current_user
from document_iq_platform_application.services.query_service import query_group

router = APIRouter(prefix="/groups", tags=["Query"])


class QueryRequest(BaseModel):
    session_id: str
    question: str


@router.post("/{group_id}/query")
def group_query_endpoint(
    group_id: int,
    payload: QueryRequest,
    current_user=Depends(get_current_user),
):
    return query_group(
        user=current_user,
        group_id=group_id,
        session_id=payload.session_id,
        question=payload.question,
    )