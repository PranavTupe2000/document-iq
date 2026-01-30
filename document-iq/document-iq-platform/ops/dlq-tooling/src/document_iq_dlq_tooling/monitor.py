from platform_shared.messaging.kafka import create_consumer
from document_iq_core.utils import get_logger
from document_iq_dlq_tooling.storage import DLQStorage

logger = get_logger("DLQMonitor")

storage = DLQStorage()


def monitor_dlq():
    consumer = create_consumer(
        topic="document.dlq",
        bootstrap_servers="kafka:9092",
        group_id="dlq-monitor",
    )

    for msg in consumer:
        event = msg.value
        logger.error(
            f"DLQ event received for request_id={event['request_id']} "
            f"stage={event['stage']}"
        )

        storage.store(event)

if __name__ == "__main__":
    monitor_dlq()