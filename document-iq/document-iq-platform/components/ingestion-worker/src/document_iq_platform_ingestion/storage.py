import base64
import os
from document_iq_core.utils import get_logger

logger = get_logger("IngestionStorage")

BASE_DIR = "/srv/data/documents"

def safe_b64decode(data: str) -> bytes:
    data = data.strip()

    # Fix padding
    missing = len(data) % 4
    if missing:
        data += "=" * (4 - missing)

    return base64.b64decode(data)

def store_document(request_id: str, file_name: str, content_base64: str):
    os.makedirs(BASE_DIR, exist_ok=True)

    file_path = os.path.join(BASE_DIR, f"{request_id}_{file_name}")

    with open(file_path, "wb") as f:
        f.write(safe_b64decode(content_base64))

    logger.info(f"Stored document at {file_path}")

    return file_path
