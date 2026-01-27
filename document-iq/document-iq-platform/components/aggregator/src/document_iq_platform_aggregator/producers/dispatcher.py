from platform_shared.messaging.kafka import create_producer
from platform_shared.config.settings import Settings
from document_iq_core.utils import get_logger

logger = get_logger("AggregatorDispatcher")
settings = Settings()

producer = create_producer(settings.kafka_bootstrap_servers)


def dispatch(topic: str, event: dict):
    logger.info(f"Dispatching event to {topic}")
    producer.send(topic, event)
    producer.flush()
