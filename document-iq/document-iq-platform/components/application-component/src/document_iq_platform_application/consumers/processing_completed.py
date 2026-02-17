from platform_shared.messaging.kafka import create_consumer
from document_iq_platform_application.services.persistence_service import (
    persist_processing_result,
)
from document_iq_core.utils import get_logger
from platform_shared.config.settings import Settings

logger = get_logger("ProcessingConsumer")
settings = Settings()


def start_consumer():
    consumer = create_consumer(
        topic="document.processing.completed",
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id="application-processing",
    )

    for msg in consumer:
        event = msg.value
        persist_processing_result(event)
