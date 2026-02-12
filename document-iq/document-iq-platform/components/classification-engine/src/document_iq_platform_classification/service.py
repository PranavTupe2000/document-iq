import pandas as pd
from platform_shared.config.settings import Settings
from platform_shared.storage.redis_client import get_redis_client
from platform_shared.messaging.kafka import create_producer
from document_iq_core.utils import get_logger
from document_iq_platform_classification.model_loader import load_model

logger = get_logger("ClassificationService")
settings = Settings()

producer = create_producer(bootstrap_servers=settings.kafka_bootstrap_servers)
redis_client = get_redis_client()
model = load_model()


def process_event(event: dict):
    request_id = event["request_id"]
    file_path = event["file_path"]

    logger.info(f"Running classification for {request_id}")

    # For now: simple text-based placeholder
    # Later replace with real feature extraction pipeline
    df = pd.DataFrame([{"file_path": file_path}])

    prediction = model.predict(df)[0]

    # Update workflow state
    redis_client.hset(
        f"workflow:{request_id}",
        mapping={
            "classification_status": "completed",
            "classification_result": prediction,
        },
    )

    # Publish completion
    producer.send(
        "document.classification.completed",
        {
            "request_id": request_id,
            "file_path": file_path,
            "classification_result": prediction,
        },
    )

    producer.flush()

    logger.info(f"Classification completed for {request_id}")
