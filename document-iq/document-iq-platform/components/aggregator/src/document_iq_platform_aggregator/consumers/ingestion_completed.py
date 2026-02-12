from platform_shared.config.settings import Settings
from platform_shared.messaging.kafka import create_consumer, create_producer
from platform_shared.storage.redis_client import get_redis_client
from document_iq_core.utils import get_logger

logger = get_logger("AggregatorIngestionCompleted")

settings = Settings()
producer = create_producer(bootstrap_servers=settings.kafka_bootstrap_servers)
redis_client = get_redis_client()


def consume_ingestion_completed():
    consumer = create_consumer(
        topic="document.ingestion.completed",
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id="aggregator-ingestion-completed",
    )

    for msg in consumer:
        event = msg.value
        request_id = event["request_id"]

        logger.info(f"Ingestion completed for {request_id}")

        # Update workflow state
        redis_client.hset(
            f"workflow:{request_id}",
            mapping={
                "ingestion_status": "completed",
            },
        )

        # Publish next stage
        producer.send(
            "document.classification.requested",
            {
                "request_id": request_id,
                "file_path": event["file_path"],
            },
        )

        producer.flush()

        logger.info(f"Classification requested for {request_id}")
