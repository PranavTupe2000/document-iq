import logging
import os
import sys
import json
from datetime import datetime

SERVICE_NAME = os.getenv("SERVICE_NAME", "unknown-service")
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")


class JsonFormatter(logging.Formatter):
    def format(self, record):

        log_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "service": SERVICE_NAME,
            "environment": ENVIRONMENT,
            "level": record.levelname,
            "logger": record.name,
            "line": record.lineno,
            "message": record.getMessage(),
        }

        # Optional: Add request_id if present
        if hasattr(record, "request_id"):
            log_record["request_id"] = record.request_id

        # Add exception info if exists
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_record)


def get_logger(name: str):
    logger = logging.getLogger(name)

    if not logger.handlers:
        logger.setLevel(logging.INFO)

        # stdout
        stream_handler = logging.StreamHandler(sys.stdout)
        stream_handler.setFormatter(JsonFormatter())
        logger.addHandler(stream_handler)
        
        # file logging (for local dev)
        if os.getenv("LOG_TO_FILE", "false").lower() == "true":
            os.makedirs("logs", exist_ok=True)
            file_handler = logging.FileHandler(f"logs/{SERVICE_NAME}.log")
            file_handler.setFormatter(JsonFormatter())
            logger.addHandler(file_handler)

    return logger