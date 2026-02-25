import threading
import uvicorn
from fastapi import FastAPI

from document_iq_platform_application.api import (
    groups,
    documents,
    document_crud,
    group_query,
    internal_chat,
    sessions,
)
from document_iq_platform_application.consumers.processing_completed import start_consumer
from document_iq_core.utils import get_logger

logger = get_logger("ApplicationMainApp")
app = FastAPI(title="DocumentIQ Application Component")

app.include_router(groups.router)
app.include_router(documents.router)
app.include_router(document_crud.router)
app.include_router(group_query.router)
app.include_router(internal_chat.router)
app.include_router(sessions.router)

# ------------------------------
# Background Consumer Thread
# ------------------------------
def start_kafka_consumer():
    logger.info("Consumer started")
    start_consumer()


@app.on_event("startup")
def startup_event():
    """
    Start Kafka consumer in background thread
    when FastAPI starts.
    """
    consumer_thread = threading.Thread(
        target=start_kafka_consumer,
        daemon=True
    )
    consumer_thread.start()
    app.state.consumer_thread = consumer_thread

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
