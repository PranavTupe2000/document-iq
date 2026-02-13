import json
from platform_shared.config.settings import Settings
import torch
from platform_shared.storage.redis_client import get_redis_client
from platform_shared.messaging.kafka import create_producer
from document_iq_core.utils import get_logger
from document_iq_platform_layout.model_loader import load_model
from document_iq_platform_layout.utils import preprocess_image

logger = get_logger("LayoutService")
settings = Settings()
producer = create_producer(bootstrap_servers=settings.kafka_bootstrap_servers)
redis_client = get_redis_client()
model = load_model()


def process_event(event: dict):
    request_id = event["request_id"]
    file_path = event["file_path"]

    logger.info(f"Running layout analysis for {request_id}")

    try:
        image_tensor = preprocess_image(file_path)

        with torch.no_grad():
            prediction = model.predict(image_tensor.numpy())

        # Convert output to JSON serializable format
        layout_result = prediction.tolist()

        redis_client.hset(
            f"workflow:{request_id}",
            mapping={
                "layout_status": "completed",
                "layout_result": json.dumps(layout_result),
            },
        )

        producer.send(
            "document.layout.completed",
            {
                "request_id": request_id,
                "layout_result": layout_result,
            },
        )

        producer.flush()

        logger.info(f"Layout completed for {request_id}")

    except Exception as e:
        logger.error(f"Layout failed for {request_id}: {str(e)}")
        raise
