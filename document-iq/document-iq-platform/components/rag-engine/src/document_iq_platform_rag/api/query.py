from fastapi import APIRouter
from pydantic import BaseModel
from document_iq_platform_rag.services.advanced_query_service import advanced_query

router = APIRouter()

class QueryRequest(BaseModel):
    org_id: int
    group_id: int
    question: str

@router.post("/query")
def query(request: QueryRequest):
    return advanced_query(
        org_id=request.org_id,
        group_id=request.group_id,
        question=request.question
    )
