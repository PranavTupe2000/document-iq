from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from document_iq_platform_account.schemas.auth import (
    LoginRequest,
    TokenResponse,
    RegisterOrganizationRequest,
    RegisterUserRequest,
)
from document_iq_platform_account.services.auth_service import login_user
from document_iq_platform_account.database.session import SessionLocal
from document_iq_platform_account.services.organization_service import (
    create_organization_with_admin,
)
from document_iq_platform_account.security.dependencies import get_current_user
from document_iq_platform_account.security.rbac import require_role
from document_iq_platform_account.models.user import User, RoleEnum
from document_iq_platform_account.security.password import hash_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------------
# LOGIN
# -------------------------



@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    # OAuth2 form uses "username" field
    token = login_user(db, form_data.username, form_data.password)

    if not token:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return TokenResponse(access_token=token)


# -------------------------
# REGISTER ORGANIZATION (Public Bootstrap)
# -------------------------

@router.post("/register-organization")
def register_organization(
    request: RegisterOrganizationRequest,
    db: Session = Depends(get_db),
):
    org = create_organization_with_admin(
        db,
        request.organization_name,
        request.admin_email,
        request.admin_password,
    )

    return {"organization_id": org.id}


# -------------------------
# REGISTER USER (ORG_ADMIN ONLY)
# -------------------------

@router.post("/register-user")
def register_user(
    request: RegisterUserRequest,
    current_user=Depends(require_role("ORG_ADMIN")),
    db: Session = Depends(get_db),
):
    # ORG_ADMIN is guaranteed by require_role()

    user = User(
        organization_id=current_user["org_id"],
        email=request.email,
        password_hash=hash_password(request.password),
        role=RoleEnum.USER,  # Only USER can be created via this API
    )

    db.add(user)
    db.commit()

    return {"message": "User created successfully"}
