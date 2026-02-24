from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from document_iq_platform_rag.services.advanced_query_service import advanced_query

router = APIRouter()

class QueryRequest(BaseModel):
    org_id: int
    group_id: int
    session_id: str
    question: str
    
@router.post("/query")
def query(request: QueryRequest):
    try:
        return advanced_query(
            org_id=request.org_id,
            group_id=request.group_id,
            question=request.question,
            session_id=request.session_id
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"RAG query failed: {exc}") from exc
