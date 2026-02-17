import threading
from fastapi import FastAPI

from document_iq_platform_rag.consumer import start_consumer
from document_iq_platform_rag.api import query
import uvicorn  # your new query router


app = FastAPI(title="DocumentIQ RAG Engine")


# ------------------------------
# Register API routes
# ------------------------------
app.include_router(query.router)


# ------------------------------
# Background Consumer Thread
# ------------------------------
def start_kafka_consumer():
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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8003)