from platform_shared.config.settings import Settings
from platform_shared.messaging.kafka import create_consumer, create_producer
from platform_shared.storage.redis_client import get_redis_client
from document_iq_core.utils import get_logger

logger = get_logger("AggregatorClassificationCompleted")

settings = Settings()
producer = create_producer(bootstrap_servers=settings.kafka_bootstrap_servers)
redis_client = get_redis_client()


def consume_classification_completed():
    consumer = create_consumer(
        topic="document.classification.completed",
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id="aggregator-classification-completed",
    )

    for msg in consumer:
        event = msg.value
        request_id = event["request_id"]
        classification_result = event["classification_result"]
        file_path = event["file_path"]

        logger.info(f"Classification completed for {request_id}")

        redis_client.hset(
            f"workflow:{request_id}",
            mapping={
                "classification_status": "completed",
                "classification_result": classification_result,
            },
        )

        # Trigger layout stage
        producer.send(
            "document.layout.requested",
            {
                "request_id": request_id,
                "file_path": file_path,
            },
        )

        producer.flush()

        logger.info(f"Layout requested for {request_id}")
