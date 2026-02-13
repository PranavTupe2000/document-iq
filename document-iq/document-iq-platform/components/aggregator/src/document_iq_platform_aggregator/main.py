from threading import Thread
from document_iq_platform_aggregator.consumers.ingestion_completed import (
    consume_ingestion_completed,
)
from document_iq_platform_aggregator.consumers.classification_completed import (
    consume_classification_completed,
)
from document_iq_platform_aggregator.consumers.layout_completed import (
    consume_layout_completed
)

from document_iq_platform_aggregator.consumers.ocr_completed import (
    consume_ocr_completed
)

if __name__ == "__main__":
    Thread(target=consume_ingestion_completed).start()
    Thread(target=consume_classification_completed).start()
    Thread(target=consume_layout_completed).start()
    Thread(target=consume_ocr_completed).start()
