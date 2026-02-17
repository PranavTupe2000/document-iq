from platform_shared.messaging.kafka import create_producer
from platform_shared.config.settings import Settings

settings = Settings()
producer = create_producer(settings.kafka_bootstrap_servers)


def publish_ingestion_event(event: dict):
    producer.send("document.ingestion.requested", event)
    producer.flush()
