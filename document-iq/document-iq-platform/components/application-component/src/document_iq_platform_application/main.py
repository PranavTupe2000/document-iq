from fastapi import FastAPI

from document_iq_platform_application.api import (
    groups,
    documents,
    status,
    chat,
    group_query,
)
import uvicorn

app = FastAPI(title="DocumentIQ Application Component")

app.include_router(groups.router)
app.include_router(documents.router)
app.include_router(group_query)
# app.include_router(status.router)
# app.include_router(chat.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)