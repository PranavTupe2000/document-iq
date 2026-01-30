import redis
from platform_shared.config.settings import Settings
from document_iq_core.utils import get_logger

logger = get_logger("RedisClient")
settings = Settings()


def get_redis_client():
    return redis.Redis(
        host=settings.redis_host,
        port=settings.redis_port,
        decode_responses=True,
    )
