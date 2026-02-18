from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import uvicorn

from document_iq_ui_bff.proxy import account_proxy, application_proxy
from platform_shared.config.settings import Settings

settings = Settings()

app = FastAPI(title="DocumentIQ UI-BFF")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.ui_portal_url
    ],
    allow_credentials=True,
    allow_methods=["*"],              # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],              # Authorization, Content-Type, etc.
)

# Account APIs
app.include_router(account_proxy.router, tags=["Account"])

# Application APIs
app.include_router(application_proxy.router, tags=["Application"])


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)