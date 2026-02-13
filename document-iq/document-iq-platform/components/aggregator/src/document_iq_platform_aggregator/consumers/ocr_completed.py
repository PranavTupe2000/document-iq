from platform_shared.config.settings import Settings
from platform_shared.messaging.kafka import create_consumer, create_producer
from platform_shared.storage.redis_client import get_redis_client
from document_iq_core.utils import get_logger

logger = get_logger("OCRCompletedConsumer")

settings = Settings()
redis_client = get_redis_client()
producer = create_producer(bootstrap_servers=settings.kafka_bootstrap_servers)

def consume_ocr_completed():
    consumer = create_consumer(
        topic="document.ocr.completed",
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id="aggregator-ocr-completed",
    )

    for msg in consumer:
        event = msg.value
        request_id = event["request_id"]
        file_path = event["file_path"]

        logger.info(f"OCR completed for {request_id}")

        redis_client.hset(
            f"workflow:{request_id}",
            mapping={
                "ocr_status": "completed"
            },
        )

        # Trigger classification with only request_id
        producer.send(
            "document.classification.requested",
            {
                "request_id": request_id,
                "file_path": file_path,
            },
        )
        producer.flush()

        logger.info(f"Classification requested for {request_id}")