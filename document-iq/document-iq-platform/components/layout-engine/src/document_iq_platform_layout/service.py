import json
from platform_shared.storage.redis_client import get_redis_client
from platform_shared.messaging.kafka import create_producer
from platform_shared.config.settings import Settings
from document_iq_core.utils import get_logger
from document_iq_platform_layout.layout.providers.factory import get_layout_provider

logger = get_logger("LayoutService")

settings = Settings()
redis_client = get_redis_client()
producer = create_producer(settings.kafka_bootstrap_servers)

layout_provider = get_layout_provider()


def process_event(event: dict):
    request_id = event["request_id"]

    workflow = redis_client.hgetall(f"workflow:{request_id}")

    if "ocr_text" not in workflow:
        logger.error(f"OCR text missing for {request_id}")
        return

    ocr_text = workflow["ocr_text"]

    layout_result = layout_provider.extract_layout(ocr_text)

    redis_client.hset(
        f"workflow:{request_id}",
        mapping={
            "layout_status": "completed",
            "layout_result": json.dumps(layout_result),
            "current_stage": "layout_completed"
        }
    )

    logger.info(f"Simulated Layout completed for {request_id}")

    producer.send(
        "document.rag.requested",
        {
            "request_id": request_id
        },
    )

    producer.flush()
