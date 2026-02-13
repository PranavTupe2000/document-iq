import base64
import binascii
import os
from document_iq_core.utils import get_logger

logger = get_logger("IngestionStorage")

BASE_DIR = os.getenv("DOCUMENT_IQ_DOCUMENTS_DIR", "/srv/data/documents")

def safe_b64decode(data: str) -> bytes:
    if not data:
        raise ValueError("Document payload is empty")

    data = data.strip()

    # Support data URLs like: data:image/png;base64,<payload>
    if ";base64," in data:
        data = data.split(";base64,", 1)[1].strip()

    # Support urlsafe base64 input
    data = data.replace("-", "+").replace("_", "/")

    # Fix padding
    missing = len(data) % 4
    if missing:
        data += "=" * (4 - missing)

    try:
        return base64.b64decode(data, validate=True)
    except binascii.Error as exc:
        raise ValueError("Invalid base64 payload for document content") from exc

def store_document(request_id: str, file_name: str, content_base64: str):
    os.makedirs(BASE_DIR, exist_ok=True)

    safe_name = os.path.basename(file_name).strip() if file_name else ""
    if not safe_name:
        safe_name = "uploaded.bin"

    file_path = os.path.join(BASE_DIR, f"{request_id}_{safe_name}")

    with open(file_path, "wb") as f:
        f.write(safe_b64decode(content_base64))

    logger.info(f"Stored document at {file_path}")

    return file_path
