from fastapi import FastAPI
import uvicorn
from document_iq_ui_bff.routes import document

app = FastAPI(title="DocumentIQ UI-BFF")

app.include_router(
    document.router,
    prefix="/api/v1/document",
    tags=["Document"],
)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)