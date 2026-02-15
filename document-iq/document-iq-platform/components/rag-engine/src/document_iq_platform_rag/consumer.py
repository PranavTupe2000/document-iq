from platform_shared.config.settings import Settings
from platform_shared.messaging.kafka import create_consumer
from document_iq_core.utils import get_logger
from document_iq_platform_rag.service import process_event

logger = get_logger("RAGConsumer")
settings = Settings()

def start_consumer():
    consumer = create_consumer(
        topic="document.rag.requested",
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id="rag-worker",
    )

    for msg in consumer:
        process_event(msg.value)
