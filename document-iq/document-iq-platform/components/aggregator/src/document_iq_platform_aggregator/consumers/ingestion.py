from datetime import datetime
from platform_shared.messaging.kafka import create_consumer, create_producer
from platform_shared.storage.redis_client import get_redis_client
from platform_shared.config.settings import Settings
from document_iq_core.utils import get_logger

logger = get_logger("IngestionConsumer")
settings = Settings()

producer = create_producer(bootstrap_servers=settings.kafka_bootstrap_servers)
redis_client = get_redis_client()


def consume_ingestion():
    consumer = create_consumer(
        topic="document.ingestion.requested",
        group_id="aggregator-ingestion",
        bootstrap_servers=settings.kafka_bootstrap_servers,
    )

    logger.info("Ingestion consumer started")

    for msg in consumer:
        event = msg.value
        request_id = event["request_id"]

        try:
            # 1️⃣ Update workflow state
            redis_client.hset(
                f"workflow:{request_id}",
                mapping={
                    "stage": "ingestion",
                    "status": "completed",
                    "updated_at": datetime.utcnow().isoformat(),
                },
            )

            # 2️⃣ Emit next stage event
            next_event = {
                "request_id": request_id,
                "document_id": event["document_id"],
                "file_name": event["file_name"],
                "content_base64": event["content_base64"],
                "previous_stage": "ingestion",
                "requested_at": datetime.utcnow().isoformat(),
            }

            producer.send(
                topic="document.layout.requested",
                value=next_event,
            )

            logger.info(
                "Moved workflow to layout stage",
                extra={"request_id": request_id},
            )

        except Exception as e:
            logger.exception("Ingestion stage failed")

            producer.send(
                topic="document.dlq",
                value={
                    "request_id": request_id,
                    "stage": "ingestion",
                    "error": str(e),
                    "event": event,
                },
            )
