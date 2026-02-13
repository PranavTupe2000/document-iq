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
        request_id = event.get("request_id")
        has_classification_result = "classification_result" in event
        classification_result = event.get("classification_result")
        file_path = event.get("file_path")

        if not request_id:
            logger.error(f"Skipping malformed classification event without request_id: {event}")
            continue

        if not has_classification_result:
            logger.error(
                "Skipping classification event for "
                f"{request_id}: classification_result key missing; "
                f"event_keys={list(event.keys())}"
            )
            continue

        if classification_result is None:
            logger.error(
                "Skipping classification event for "
                f"{request_id}: classification_result is null; "
                f"event_keys={list(event.keys())}"
            )
            continue

        if not file_path:
            logger.error(f"Skipping classification event for {request_id}: missing file_path")
            continue

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
