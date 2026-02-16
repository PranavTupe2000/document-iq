from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from document_iq_platform_account.database.session import SessionLocal
from document_iq_platform_account.models.user import User, RoleEnum
from document_iq_platform_account.security.rbac import require_role
from document_iq_platform_account.security.dependencies import get_current_user
from document_iq_platform_account.security.password import hash_password

router = APIRouter(prefix="/users", tags=["Users"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------------
# GET MY PROFILE
# -------------------------

@router.get("/me")
def get_my_profile(current_user=Depends(get_current_user)):
    return current_user


# -------------------------
# LIST USERS (ORG_ADMIN)
# -------------------------

@router.get("/")
def list_users(
    current_user=Depends(require_role("ORG_ADMIN")),
    db: Session = Depends(get_db),
):
    users = db.query(User).filter(
        User.organization_id == current_user["org_id"]
    ).all()

    return users


# -------------------------
# UPDATE USER (ORG_ADMIN)
# -------------------------

@router.put("/{user_id}")
def update_user(
    user_id: int,
    email: str | None = None,
    password: str | None = None,
    current_user=Depends(require_role("ORG_ADMIN")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.id == user_id,
        User.organization_id == current_user["org_id"],
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if email:
        user.email = email

    if password:
        user.password_hash = hash_password(password)

    db.commit()
    db.refresh(user)

    return {"message": "User updated"}


# -------------------------
# DELETE USER (ORG_ADMIN)
# -------------------------

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user=Depends(require_role("ORG_ADMIN")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.id == user_id,
        User.organization_id == current_user["org_id"],
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return {"message": "User deleted"}
