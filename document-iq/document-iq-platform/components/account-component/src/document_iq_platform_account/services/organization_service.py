from sqlalchemy.orm import Session
from document_iq_platform_account.models.organization import Organization
from document_iq_platform_account.models.user import User, RoleEnum
from document_iq_platform_account.security.password import hash_password
from document_iq_platform_account.saga.publisher import publish_event
from document_iq_platform_account.saga.events import SagaEvents


def create_organization_with_admin(
    db: Session,
    org_name: str,
    admin_email: str,
    admin_password: str,
):
    org = Organization(name=org_name)
    db.add(org)
    db.flush()

    admin = User(
        organization_id=org.id,
        email=admin_email,
        password_hash=hash_password(admin_password),
        role=RoleEnum.ORG_ADMIN,
    )

    db.add(admin)
    db.commit()

    # 🔁 Publish SAGA event
    publish_event(
        SagaEvents.ORGANIZATION_CREATED,
        {
            "organization_id": org.id,
            "organization_name": org_name,
        },
    )

    return org
