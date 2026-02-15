from platform_shared.config.settings import Settings
from platform_shared.messaging.kafka import create_consumer, create_producer
from platform_shared.storage.redis_client import get_redis_client
from document_iq_core.utils import get_logger

import json

logger = get_logger("LayoutCompletedConsumer")
redis_client = get_redis_client()
settings = Settings()
producer = create_producer(bootstrap_servers=settings.kafka_bootstrap_servers)

def consume_layout_completed():
    consumer = create_consumer(
        topic="document.layout.completed",
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id="aggregator-layout-completed",
    )

    for msg in consumer:
        event = msg.value
        request_id = event["request_id"]

        logger.info(f"Layout completed for {request_id}")

        redis_client.hset(
            f"workflow:{request_id}",
            mapping={
                "layout_status": "completed",
                "layout_result": json.dumps(event["layout_result"]),
            },
        )
        
        producer.send(
            "document.rag.requested",
            {"request_id": request_id},
        )
        producer.flush()

        logger.info(f"Triggered RAG for {request_id}")
