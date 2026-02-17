from platform_shared.config.settings import Settings
from platform_shared.messaging.kafka import create_consumer, create_producer
from platform_shared.storage.redis_client import get_redis_client
from document_iq_core.utils import get_logger

import json

logger = get_logger("LayoutCompletedConsumer")
redis_client = get_redis_client()
settings = Settings()
producer = create_producer(bootstrap_servers=settings.kafka_bootstrap_servers)

def consume_rag_completed():
    consumer = create_consumer(
        topic="document.rag.completed",
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id="aggregator-rag-completed",
    )

    for msg in consumer:
        event = msg.value
        request_id = event["request_id"]

        logger.info(f"RAG completed for {request_id}")
        
        workflow = redis_client.hgetall(f"workflow:{request_id}")

        producer.send(
            "document.processing.completed",
            {
                "document_id": workflow.get("document_id"),
                "classification": workflow.get("classification_result"),
                "layout_result": workflow.get("layout_result"),
                "rag_result": workflow.get("rag_response"),
            },
        )
        producer.flush()
