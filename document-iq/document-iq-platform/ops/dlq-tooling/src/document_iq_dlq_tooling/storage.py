import json
from datetime import datetime
from document_iq_core.utils import get_logger
from document_iq_platform_aggregator.workflow.redis_client import get_redis_client

logger = get_logger("DLQStorage")

DLQ_KEY_PREFIX = "dlq"
DLQ_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days


class DLQStorage:
    def __init__(self):
        self.redis = get_redis_client()

    def store(self, event: dict):
        event_id = f"{event['request_id']}:{event['stage']}:{event['retry_count']}"
        key = f"{DLQ_KEY_PREFIX}:{event_id}"

        payload = {
            "event": event,
            "stored_at": datetime.utcnow().isoformat(),
        }

        self.redis.set(
            key,
            json.dumps(payload),
            ex=DLQ_TTL_SECONDS,
        )

        logger.info(f"Stored DLQ event {key}")

    def list_events(self):
        keys = self.redis.keys(f"{DLQ_KEY_PREFIX}:*")
        return keys

    def get(self, key: str):
        data = self.redis.get(key)
        return json.loads(data) if data else None

    def delete(self, key: str):
        self.redis.delete(key)
