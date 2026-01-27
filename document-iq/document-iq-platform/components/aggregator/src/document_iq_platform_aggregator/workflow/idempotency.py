from document_iq_core.utils import get_logger
from document_iq_platform_aggregator.workflow.redis_client import get_redis_client

logger = get_logger("Idempotency")

IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24  # 24 hours


class IdempotencyGuard:
    def __init__(self):
        self.redis = get_redis_client()

    def is_duplicate(self, request_id: str, stage: str) -> bool:
        """
        Returns True if this (request_id, stage) was already processed.
        """
        key = f"idempotency:{request_id}:{stage}"

        # SETNX behavior via set(..., nx=True)
        created = self.redis.set(
            key,
            "1",
            nx=True,
            ex=IDEMPOTENCY_TTL_SECONDS,
        )

        if not created:
            logger.warning(
                f"Duplicate event ignored for request_id={request_id}, stage={stage}"
            )
            return True

        return False
