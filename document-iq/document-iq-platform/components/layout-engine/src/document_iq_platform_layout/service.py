import re
from platform_shared.storage.redis_client import get_redis_client
from platform_shared.messaging.kafka import create_producer
from platform_shared.config.settings import Settings
from document_iq_core.utils import get_logger

logger = get_logger("LayoutService")

settings = Settings()
redis_client = get_redis_client()
producer = create_producer(settings.kafka_bootstrap_servers)


def split_into_blocks(text: str):
    """
    Very simple structural segmentation:
    Split by blank lines.
    """
    raw_blocks = re.split(r"\n\s*\n", text.strip())

    blocks = []
    for i, block in enumerate(raw_blocks):
        block = block.strip()
        if not block:
            continue

        blocks.append({
            "text": block,
            "position": i
        })

    return blocks


def classify_block(block_text: str):
    """
    Basic rule-based structural tagging.
    Later we replace this with real layout model.
    """

    if "invoice" in block_text.lower():
        return "header"

    if "signature" in block_text.lower():
        return "footer"

    if len(block_text) < 40:
        return "metadata"

    return "body"


def process_event(event: dict):
    request_id = event["request_id"]

    workflow = redis_client.hgetall(f"workflow:{request_id}")

    if "ocr_text" not in workflow:
        logger.error(f"OCR text missing for {request_id}")
        return

    ocr_text = workflow["ocr_text"]

    blocks = split_into_blocks(ocr_text)

    structured_blocks = []

    for block in blocks:
        structured_blocks.append({
            "type": classify_block(block["text"]),
            "text": block["text"],
            "position": block["position"]
        })

    layout_result = {
        "blocks": structured_blocks
    }

    # Update workflow
    redis_client.hset(
        f"workflow:{request_id}",
        mapping={
            "layout_status": "completed",
            "layout_result": str(layout_result),
            "current_stage": "layout_completed"
        }
    )

    logger.info(f"Layout completed for {request_id}")

    # Publish next stage
    producer.send(
        "document.rag.requested",
        {
            "request_id": request_id
        }
    )

    producer.flush()
