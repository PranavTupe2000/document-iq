from fastapi import FastAPI
from document_iq_platform_account.api import auth, organization, user
import uvicorn

from platform_shared.tracing import setup_tracing
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

setup_tracing()

app = FastAPI(title="DocumentIQ Account Component")

FastAPIInstrumentor.instrument_app(app)
SQLAlchemyInstrumentor().instrument()

app.include_router(auth.router)
app.include_router(organization.router)
app.include_router(user.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)