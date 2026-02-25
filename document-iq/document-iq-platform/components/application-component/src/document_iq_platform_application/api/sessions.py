from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List

from document_iq_platform_application.security.dependencies import get_current_user
from document_iq_platform_application.repositories.chat_repository import (
    create_session,
    get_all_messages,
    get_session,
    list_sessions,
    rename_session,
)

router = APIRouter(prefix="/groups", tags=["Sessions"])


# =========================================================
# 🔹 Models
# =========================================================

class RenameSessionRequest(BaseModel):
    title: str


# =========================================================
# 🔹 Create Session
# =========================================================

@router.post("/{group_id}/sessions")
def create_new_session(group_id: int, current_user=Depends(get_current_user)):

    session = create_session(
        org_id=current_user["org_id"],
        group_id=group_id,
        title="New Chat"
    )

    return session


# =========================================================
# 🔹 List Sessions
# =========================================================

@router.get("/{group_id}/sessions")
def list_group_sessions(group_id: int, current_user=Depends(get_current_user)):

    sessions = list_sessions(current_user["org_id"], group_id)

    return sessions


# =========================================================
# 🔹 Rename Session
# =========================================================

@router.patch("/{group_id}/sessions/{session_id}")
def rename_group_session(
    group_id: int,
    session_id: str,
    payload: RenameSessionRequest,
    current_user=Depends(get_current_user)
):

    if not payload.title:
        raise HTTPException(status_code=400, detail="Title required")

    rename_session(session_id, payload.title)

    return {"message": "Renamed successfully"}

# =========================================================
# 🔹 Fetch Full Chat History
# =========================================================

@router.get("/{group_id}/sessions/{session_id}/history")
def get_session_history(
    group_id: int,
    session_id: str,
    current_user=Depends(get_current_user),
):
    session = get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 🔒 Multi-tenant validation
    if str(session["org_id"]) != str(current_user["org_id"]):
        raise HTTPException(status_code=403, detail="Forbidden")

    messages = get_all_messages(session_id)

    return {
        "session_id": session_id,
        "title": session.get("title"),
        "summary_memory": session.get("summary_memory"),
        "created_at": session.get("created_at"),
        "messages": messages,
    }