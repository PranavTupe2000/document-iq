import time
from document_iq_core.utils import get_logger

logger = get_logger("RetryHandler")

MAX_RETRIES = 3
BACKOFF_SECONDS = [5, 10, 15]


def should_retry(event: dict) -> bool:
    return event.get("retry_count", 0) < MAX_RETRIES


def apply_backoff(event: dict):
    retry_count = event.get("retry_count", 0)
    if retry_count < len(BACKOFF_SECONDS):
        delay = BACKOFF_SECONDS[retry_count]
        logger.warning(f"Retrying after {delay}s (attempt {retry_count + 1})")
        time.sleep(delay)
