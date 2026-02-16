from sqlalchemy.orm import Session
from document_iq_platform_account.models.user import User
from document_iq_platform_account.security.password import verify_password
from document_iq_platform_account.security.jwt import create_access_token


def authenticate_user(
    db: Session,
    email: str,
    password: str,
):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


def login_user(db: Session, email: str, password: str):
    user = authenticate_user(db, email, password)

    if not user:
        return None

    token = create_access_token(
        {
            "sub": str(user.id),
            "org_id": str(user.organization_id),
            "role": user.role.value,
        }
    )

    return token
