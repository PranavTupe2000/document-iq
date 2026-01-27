from document_iq_core.utils import get_logger
from platform_shared.messaging.kafka import create_producer
from platform_shared.config.settings import Settings
from document_iq_dlq_tooling.storage import DLQStorage

logger = get_logger("DLQReplay")

settings = Settings()
storage = DLQStorage()
producer = create_producer(settings.kafka_bootstrap_servers)


def replay_event(dlq_key: str, target_topic: str):
    record = storage.get(dlq_key)
    if not record:
        logger.error(f"No DLQ event found for key {dlq_key}")
        return

    event = record["event"]

    logger.warning(
        f"Replaying DLQ event request_id={event['request_id']} "
        f"stage={event['stage']}"
    )

    producer.send(target_topic, event)
    producer.flush()

    # Optional: delete after replay
    storage.delete(dlq_key)
