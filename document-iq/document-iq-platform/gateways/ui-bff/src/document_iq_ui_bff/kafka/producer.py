import json
from kafka import KafkaProducer
from document_iq_core.utils import get_logger

logger = get_logger("UIBFFKafkaProducer")


class EventProducer:
    def __init__(self, brokers: str):
        self.producer = KafkaProducer(
            bootstrap_servers=brokers,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )

    def publish(self, topic: str, event: dict):
        logger.info(f"Publishing event to {topic}")
        self.producer.send(topic, event)
        self.producer.flush()
