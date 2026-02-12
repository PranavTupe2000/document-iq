from threading import Thread
from document_iq_platform_aggregator.consumers.ingestion_completed import (
    consume_ingestion_completed,
)
from document_iq_platform_aggregator.consumers.classification_completed import (
    consume_classification_completed,
)

if __name__ == "__main__":
    Thread(target=consume_ingestion_completed).start()
    Thread(target=consume_classification_completed).start()
