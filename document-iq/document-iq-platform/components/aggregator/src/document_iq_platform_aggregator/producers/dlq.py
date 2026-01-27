from datetime import datetime
from platform_shared.messaging.kafka import create_producer
from platform_shared.config.settings import Settings
from document_iq_core.utils import get_logger

logger = get_logger("DLQProducer")
settings = Settings()

producer = create_producer(settings.kafka_bootstrap_servers)


def send_to_dlq(event: dict, error: Exception):
    dlq_event = {
        "request_id": event.get("request_id"),
        "stage": event.get("stage"),
        "retry_count": event.get("retry_count", 0),
        "error": str(error),
        "failed_at": datetime.utcnow().isoformat(),
        "original_event": event,
    }

    logger.error(f"Sending event to DLQ: {dlq_event}")

    producer.send("document.dlq", dlq_event)
    producer.flush()
