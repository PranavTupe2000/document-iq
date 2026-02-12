from platform_shared.config.settings import Settings
from platform_shared.messaging.kafka import create_consumer
from document_iq_core.utils import get_logger
from document_iq_platform_classification.service import process_event

logger = get_logger("ClassificationConsumer")
settings = Settings()

def start_consumer():
    consumer = create_consumer(
        topic="document.classification.requested",
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id="classification-worker",
    )

    for msg in consumer:
        event = msg.value
        logger.info(f"Received classification request: {event['request_id']}")
        process_event(event)
