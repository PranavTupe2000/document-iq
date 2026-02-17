from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from document_iq_platform_application.database.session import SessionLocal
from document_iq_platform_application.models.group import Group
from document_iq_platform_application.schemas.group import (
    GroupCreate,
    GroupResponse,
)
from document_iq_platform_application.security.dependencies import (
    get_current_user,
)

router = APIRouter(prefix="/groups", tags=["Groups"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# CREATE GROUP
@router.post("/", response_model=GroupResponse)
def create_group(
    request: GroupCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = Group(
        name=request.name,
        organization_id=current_user["org_id"],
    )

    db.add(group)
    db.commit()
    db.refresh(group)

    return group


# LIST GROUPS
@router.get("/", response_model=list[GroupResponse])
def list_groups(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Group).filter(
        Group.organization_id == current_user["org_id"]
    ).all()


# DELETE GROUP
@router.delete("/{group_id}")
def delete_group(
    group_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(Group).filter(
        Group.id == group_id,
        Group.organization_id == current_user["org_id"],
    ).first()

    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    db.delete(group)
    db.commit()

    return {"message": "Group deleted"}
