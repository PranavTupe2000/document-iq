from threading import Thread
from document_iq_platform_aggregator.consumers.ingestion_completed import (
    consume_ingestion_completed,
)

if __name__ == "__main__":
    Thread(target=consume_ingestion_completed).start()
