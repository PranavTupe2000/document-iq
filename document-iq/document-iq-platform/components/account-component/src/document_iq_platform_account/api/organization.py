from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from document_iq_platform_account.database.session import SessionLocal
from document_iq_platform_account.models.organization import Organization
from document_iq_platform_account.security.rbac import require_role

router = APIRouter(prefix="/organizations", tags=["Organizations"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------------
# GET MY ORGANIZATION
# -------------------------

@router.get("/me")
def get_my_organization(
    current_user=Depends(require_role("ORG_ADMIN")),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(
        Organization.id == current_user["org_id"]
    ).first()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    return org


# -------------------------
# UPDATE ORGANIZATION
# -------------------------

@router.put("/me")
def update_my_organization(
    name: str,
    current_user=Depends(require_role("ORG_ADMIN")),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(
        Organization.id == current_user["org_id"]
    ).first()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    org.name = name
    db.commit()
    db.refresh(org)

    return {"message": "Organization updated"}


# -------------------------
# DELETE ORGANIZATION
# -------------------------

@router.delete("/me")
def delete_my_organization(
    current_user=Depends(require_role("ORG_ADMIN")),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(
        Organization.id == current_user["org_id"]
    ).first()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    db.delete(org)
    db.commit()

    return {"message": "Organization deleted"}
