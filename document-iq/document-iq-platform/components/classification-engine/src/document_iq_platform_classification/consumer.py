from platform_shared.messaging.kafka import create_consumer
from document_iq_core.utils import get_logger
from document_iq_platform_classification.service import process_event

logger = get_logger("ClassificationConsumer")


def start_consumer():
    consumer = create_consumer(
        topic="document.classification.requested",
        group_id="classification-worker",
    )

    for msg in consumer:
        event = msg.value
        logger.info(f"Received classification request: {event['request_id']}")
        process_event(event)
