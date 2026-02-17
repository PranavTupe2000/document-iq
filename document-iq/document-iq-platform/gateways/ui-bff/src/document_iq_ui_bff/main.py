from fastapi import FastAPI
from document_iq_ui_bff.proxy import account_proxy, application_proxy
import uvicorn

app = FastAPI(title="DocumentIQ UI-BFF")

# Account APIs
app.include_router(account_proxy.router, tags=["Account"])

# Application APIs
app.include_router(application_proxy.router, tags=["Application"])


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)