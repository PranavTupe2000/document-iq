import json
from platform_shared.storage.redis_client import get_redis_client
from platform_shared.messaging.kafka import create_producer
from platform_shared.config.settings import Settings

from document_iq_core.utils import get_logger
from document_iq_platform_ocr.providers.factory import get_ocr_provider
from document_iq_platform_ocr.models.ocr_result import OCRResult


logger = get_logger("OCRService")

settings = Settings()

redis_client = get_redis_client()

producer = create_producer(
    bootstrap_servers=settings.kafka_bootstrap_servers
)

ocr_provider = get_ocr_provider()


def process_event(event: dict):

    request_id = event["request_id"]
    file_path = event["file_path"]

    logger.info(f"OCR started: {request_id}")

    try:

        result: OCRResult = ocr_provider.extract(file_path)

        if not result.pages:
            raise RuntimeError("Empty OCR result")

        all_lines = []

        for page in result.pages:
            all_lines.extend(page.lines)

        extracted_text = "\n".join(all_lines)

        # Convert words to JSON-safe dict
        words_payload = []

        if result.words:
            for word in result.words:
                words_payload.append({
                    "text": word.text,
                    "bbox": word.bbox,
                    "page": word.page,
                })

        ocr_result_payload = {
            "words": words_payload,
            "full_text": extracted_text,
        }

        redis_client.hset(
            f"workflow:{request_id}",
            mapping={
                "ocr_status": "completed",
                "ocr_text": extracted_text,  # backward compatible
                "ocr_result": json.dumps(ocr_result_payload),
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

        logger.info(f"OCR completed: {request_id}")

    except Exception as exc:

        logger.exception(
            f"OCR failed: {request_id} | {exc}"
        )

        redis_client.hset(
            f"workflow:{request_id}",
            mapping={
                "ocr_status": "failed",
                "ocr_error": str(exc),
                "current_stage": "ocr_failed",
            },
        )

        raise
