from platform_shared.messaging.kafka import create_consumer
from document_iq_core.utils import get_logger
from document_iq_platform_aggregator.producers.dispatcher import dispatch

logger = get_logger("LayoutRetryConsumer")


def consume_layout_retry():
    consumer = create_consumer(
        topic="document.layout.retry",
        bootstrap_servers="kafka:9092",
        group_id="aggregator-layout-retry",
    )

    for msg in consumer:
        dispatch("document.layout.completed", msg.value)
