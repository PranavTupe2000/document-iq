import threading

from document_iq_platform_aggregator.consumers.ingestion import consume_ingestion
from document_iq_platform_aggregator.consumers.layout import consume_layout
# (others later)

def main():
    threading.Thread(target=consume_ingestion).start()
    threading.Thread(target=consume_layout).start()

if __name__ == "__main__":
    main()
