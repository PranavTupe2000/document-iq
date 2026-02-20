# src/document_iq_dl/components/yolo_data_ingestion.py

from pathlib import Path
import sys

# Ensure project root is in path (for Docker + DVC execution)
PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from document_iq_dl.datasets.funsd_to_yolo import FUNSDToYOLOConverter


class YOLODataIngestion:
    """
    Responsible for converting raw FUNSD dataset
    into YOLO-ready detection dataset format.
    """

    def __init__(self):
        self.raw_data_dir = PROJECT_ROOT / "data" / "raw" / "FUNSD"
        self.output_dir = PROJECT_ROOT / "data" / "yolo"

    def run(self):
        print("Starting YOLO Data Ingestion Stage...")
        print(f"Raw dataset path: {self.raw_data_dir}")
        print(f"Output dataset path: {self.output_dir}")

        converter = FUNSDToYOLOConverter(
            raw_data_dir=self.raw_data_dir,
            output_dir=self.output_dir,
        )

        converter.convert()

        print("YOLO Data Ingestion completed successfully.")


if __name__ == "__main__":
    ingestion = YOLODataIngestion()
    ingestion.run()