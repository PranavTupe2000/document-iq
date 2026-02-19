from platform_shared.config.settings import Settings
from platform_shared.storage.redis_client import get_redis_client
from platform_shared.messaging.kafka import create_producer
from document_iq_core.utils import get_logger
from document_iq_platform_ingestion.storage import store_document

logger = get_logger("IngestionService")

settings = Settings()

producer = create_producer(settings.kafka_bootstrap_servers)
redis_client = get_redis_client()


def process_event(event: dict):
    request_id = event["request_id"]

    # 1️⃣ Store document
    file_path = store_document(
        request_id,
        event["file_name"],
        event["content_base64"],
    )

    # 2️⃣ Update workflow state
    redis_client.hset(
        f"workflow:{request_id}",
        mapping={
            "ingestion_status": "completed",
            "file_path": file_path,
            "current_stage": "ingestion_completed",
            "document_id": event["document_id"],
            "organization_id": event.get("organization_id"),
            "group_id": event.get("group_id"),
        },
    )

    logger.info(f"Workflow updated for {request_id}")

    # 3️⃣ Publish next stage event
    producer.send(
        "document.ingestion.completed",
        {
            "request_id": request_id,
            "file_path": file_path,
        },
    )

    producer.flush()

    logger.info(f"Published ingestion completed event for {request_id}")
