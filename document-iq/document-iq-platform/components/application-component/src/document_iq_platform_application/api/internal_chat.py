from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from document_iq_platform_application.repositories.chat_repository import (
    get_session,
    save_message,
    get_recent_messages,
    update_session_summary,
)

router = APIRouter(
    prefix="/internal",
    tags=["Internal Chat"],
    include_in_schema=False  # hide from Swagger
)


# =========================================================
# 🔹 Models
# =========================================================

class MessageRequest(BaseModel):
    role: str
    content: str


class SummaryUpdateRequest(BaseModel):
    summary_memory: str
    last_summarized_index: int


class MemoryResponse(BaseModel):
    summary_memory: Optional[str]
    messages: List[dict]


# =========================================================
# 🔹 Save Chat Message
# =========================================================

@router.post("/sessions/{session_id}/messages")
def save_chat_message(session_id: str, payload: MessageRequest):
    session = get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    save_message(session_id, payload.role, payload.content)

    return {"status": "saved"}


# =========================================================
# 🔹 Fetch Conversation Memory
# =========================================================

@router.get("/sessions/{session_id}/memory", response_model=MemoryResponse)
def get_session_memory(session_id: str):
    session = get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = get_recent_messages(session_id)

    return {
        "summary_memory": session.get("summary_memory", ""),
        "messages": messages,
    }


# =========================================================
# 🔹 Update Session Summary (Rolling Memory)
# =========================================================

@router.patch("/sessions/{session_id}/summary")
def update_session_memory(session_id: str, payload: SummaryUpdateRequest):
    session = get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    update_session_summary(
        session_id=session_id,
        summary=payload.summary_memory,
        last_index=payload.last_summarized_index,
    )

    return {"status": "updated"}