from platform_shared.config.settings import Settings
from platform_shared.messaging.kafka import create_consumer
from document_iq_core.utils import get_logger
from document_iq_platform_layout.service import process_event

logger = get_logger("LayoutConsumer")
settings = Settings()

def start_consumer():
    consumer = create_consumer(
        topic="document.layout.requested",
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id="layout-worker",
    )

    for msg in consumer:
        event = msg.value
        logger.info(f"Received layout request: {event['request_id']}")
        process_event(event)
