from platform_shared.storage.redis_client import get_redis_client
from platform_shared.messaging.kafka import create_producer
from platform_shared.config.settings import Settings

from document_iq_core.utils import get_logger
from document_iq_platform_ocr.providers.factory import get_ocr_provider

logger = get_logger("OCRService")
settings = Settings()
redis_client = get_redis_client()
producer = create_producer(bootstrap_servers=settings.kafka_bootstrap_servers)
ocr_provider = get_ocr_provider()


def process_event(event: dict):
    request_id = event["request_id"]
    file_path = event["file_path"]

    logger.info(f"OCR started for {request_id}")

    result = ocr_provider.extract(file_path)

    # Extract plain text
    lines = []
    for page in result["analyzeResult"]["readResults"]:
        for line in page["lines"]:
            lines.append(line["text"])

    extracted_text = "\n".join(lines)

    redis_client.hset(
        f"workflow:{request_id}",
        mapping={
            "ocr_status": "completed",
            "ocr_text": extracted_text,
            "current_stage": "ocr_completed",
        },
    )

    producer.send(
        "document.ocr.completed",
        {
            "request_id": request_id,
            "file_path": file_path,
        },
    )
    producer.flush()

    logger.info(f"OCR completed for {request_id}")
