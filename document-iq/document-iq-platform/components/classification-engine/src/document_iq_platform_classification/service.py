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

    workflow_key = f"workflow:{request_id}"

    # Fetch OCR text from Redis
    ocr_text = redis_client.hget(workflow_key, "ocr_text")

    if not ocr_text:
        raise Exception(f"OCR text missing for {request_id}")

    logger.info(f"Running classification for {request_id}")

    prediction = model.predict([ocr_text])[0]

    redis_client.hset(
        workflow_key,
        mapping={
            "classification_status": "completed",
            "classification_result": prediction,
        },
    )

    # message = {
    #         "request_id": request_id,
    #         "classification_result": prediction,
    #         "file_path": file_path,
    #     }
    
    # print(message)
    # logger.info(f"Sending message: {message}")

    producer.send(
        "document.classification.completed",
        {
            "request_id": request_id,
            "classification_result": prediction,
            "file_path": file_path,
        },
    )
    producer.flush()

    logger.info(f"Classification completed for {request_id}")