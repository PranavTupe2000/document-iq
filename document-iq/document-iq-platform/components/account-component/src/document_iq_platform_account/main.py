from fastapi import FastAPI
from document_iq_platform_account.api import auth, organization, users

app = FastAPI(title="DocumentIQ Account Component")

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(organization.router, prefix="/organizations", tags=["Organizations"])
app.include_router(users.router, prefix="/users", tags=["Users"])
