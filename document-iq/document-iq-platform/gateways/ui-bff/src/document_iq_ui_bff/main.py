from fastapi import FastAPI
from document_iq_ui_bff.routes import document

app = FastAPI(title="DocumentIQ UI-BFF")

app.include_router(
    document.router,
    prefix="/api/v1/document",
    tags=["Document"],
)
