import json
from pathlib import Path
from typing import Dict
from PIL import Image

from document_iq_core.utils import get_logger, DocumentIQException

logger = get_logger("DLDataValidation")

ALLOWED_LABELS = {"header", "question", "answer", "other"}


class FUNSDDataValidator:
    def __init__(self, input_path: Path, report_path: Path):
        self.input_path = input_path
        self.report_path = report_path

    def _init_report(self) -> Dict:
        return {
            "total_blocks": 0,
            "invalid_schema": 0,
            "invalid_labels": 0,
            "missing_images": 0,
            "invalid_bboxes": 0,
            "empty_text": 0,
            "valid_blocks": 0,
        }

    def run(self):
        logger.info("Starting FUNSD data validation")

        if not self.input_path.exists():
            raise DocumentIQException(
                f"Validation input not found: {self.input_path}"
            )

        with open(self.input_path, "r", encoding="utf-8") as f:
            records = json.load(f)

        report = self._init_report()
        report["total_blocks"] = len(records)

        for record in records:
            try:
                # -------- Schema validation --------
                image_path = Path(record["image_path"])
                text = record["text"]
                bbox = record["bbox"]
                label = record["label"]
            except KeyError:
                report["invalid_schema"] += 1
                continue

            # -------- Label validation --------
            if label not in ALLOWED_LABELS:
                report["invalid_labels"] += 1
                continue

            # -------- Image validation --------
            if not image_path.exists():
                report["missing_images"] += 1
                continue

            try:
                with Image.open(image_path) as img:
                    img_width, img_height = img.size
            except Exception:
                report["missing_images"] += 1
                continue

            # -------- Bounding box validation --------
            if (
                not isinstance(bbox, list)
                or len(bbox) != 4
            ):
                report["invalid_bboxes"] += 1
                continue

            x0, y0, x1, y1 = bbox

            if (
                x0 < 0 or y0 < 0
                or x1 <= x0
                or y1 <= y0
                or x1 > img_width
                or y1 > img_height
            ):
                report["invalid_bboxes"] += 1
                continue

            # -------- Text validation --------
            if not isinstance(text, str) or not text.strip():
                report["empty_text"] += 1
                continue

            # -------- Valid block --------
            report["valid_blocks"] += 1

        # Save report
        self.report_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=4)

        logger.info("Validation completed successfully")
        logger.info(f"Validation report: {report}")


if __name__ == "__main__":
    FUNSDDataValidator(
        input_path=Path("data/interim/funsd_blocks.json"),
        report_path=Path("artifacts/validation_report.json"),
    ).run()
