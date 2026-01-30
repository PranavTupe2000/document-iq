import json
from datetime import datetime
from document_iq_core.utils import get_logger
from platform_shared.storage.redis_client import get_redis_client

logger = get_logger("WorkflowState")

REQUIRED_KEYS = {"ocr", "layout", "classification", "rag"}
TTL_SECONDS = 60 * 60 * 24  # 24 hours


class WorkflowState:
    def __init__(self):
        self.redis = get_redis_client()

    def update(self, request_id: str, key: str, value: dict):
        redis_key = f"workflow:{request_id}"

        self.redis.hset(
            redis_key,
            key,
            json.dumps(value),
        )

        self.redis.hset(
            redis_key,
            mapping={
                "status": "in_progress",
                "updated_at": datetime.utcnow().isoformat(),
            },
        )

        self.redis.expire(redis_key, TTL_SECONDS)

        logger.info(f"Updated workflow {request_id} with {key}")

    def is_complete(self, request_id: str) -> bool:
        redis_key = f"workflow:{request_id}"
        keys = set(self.redis.hkeys(redis_key))
        return REQUIRED_KEYS.issubset(keys)

    def get_result(self, request_id: str) -> dict:
        redis_key = f"workflow:{request_id}"
        data = self.redis.hgetall(redis_key)

        return {
            k: json.loads(v)
            for k, v in data.items()
            if k in REQUIRED_KEYS
        }

    def mark_completed(self, request_id: str):
        redis_key = f"workflow:{request_id}"
        self.redis.hset(redis_key, "status", "completed")
        logger.info(f"Workflow {request_id} marked completed")
