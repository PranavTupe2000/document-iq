from platform_shared.config.settings import Settings
from platform_shared.messaging.kafka import create_consumer
from document_iq_platform_ocr.service import process_event

settings = Settings()

def start_consumer():
    consumer = create_consumer(
        topic="document.ocr.requested",
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id="ocr-worker",
    )

    for msg in consumer:
        process_event(msg.value)
