from platform_shared.messaging.kafka import create_consumer
from platform_shared.config.settings import Settings
from document_iq_core.utils import get_logger
from document_iq_platform_aggregator.producers.dispatcher import dispatch

logger = get_logger("IngestionConsumer")
settings = Settings()


def consume_ingestion():
    consumer = create_consumer(
        topic="document.ingestion.requested",
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id="aggregator-ingestion",
    )

    for msg in consumer:
        event = msg.value
        request_id = event["request_id"]

        logger.info(f"Received ingestion request {request_id}")

        # Fan-out
        dispatch("document.ocr.requested", event)
        dispatch("document.layout.requested", event)
        dispatch("document.classification.requested", event)
        dispatch("document.rag.requested", event)
