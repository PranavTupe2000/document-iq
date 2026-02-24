from fastapi import APIRouter, Depends, HTTPException
from document_iq_platform_application.security.dependencies import get_current_user
from document_iq_platform_rag.repositories.chat_repository import (
    create_session,
    list_sessions,
    rename_session,
)

router = APIRouter(prefix="/groups", tags=["Sessions"])


@router.post("/{group_id}/sessions")
def create_new_session(group_id: int, current_user=Depends(get_current_user)):
    # temporary title, will auto-generate later
    session = create_session(
        org_id=current_user["org_id"],
        group_id=group_id,
        title="New Chat"
    )
    return session


@router.get("/{group_id}/sessions")
def list_group_sessions(group_id: int, current_user=Depends(get_current_user)):
    return list_sessions(current_user["org_id"], group_id)


@router.patch("/{group_id}/sessions/{session_id}")
def rename_group_session(group_id: int, session_id: str, payload: dict):
    new_title = payload.get("title")
    if not new_title:
        raise HTTPException(status_code=400, detail="Title required")

    rename_session(session_id, new_title)
    return {"message": "Renamed successfully"}