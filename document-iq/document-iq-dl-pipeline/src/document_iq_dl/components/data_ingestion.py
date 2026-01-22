import json
from pathlib import Path
from document_iq_core.utils import get_logger, DocumentIQException

logger = get_logger("DLDataIngestion")


class FUNSDIngestion:
    def __init__(self, raw_dir: Path, output_path: Path):
        self.raw_dir = raw_dir
        self.output_path = output_path

    def run(self):
        logger.info("Starting FUNSD data ingestion")

        images_dir = self.raw_dir / "training_data" / "images"
        ann_dir = self.raw_dir / "training_data" / "annotations"

        if not images_dir.exists() or not ann_dir.exists():
            raise DocumentIQException("FUNSD directory structure invalid")

        records = []

        for ann_file in ann_dir.glob("*.json"):
            with open(ann_file, "r", encoding="utf-8") as f:
                ann = json.load(f)

            image_file = images_dir / f"{ann_file.stem}.png"
            if not image_file.exists():
                continue

            for block in ann["form"]:
                records.append({
                    "image_path": str(image_file),
                    "text": block["text"],
                    "bbox": block["box"],
                    "label": block["label"],
                })

        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.output_path, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2)

        logger.info(
            f"Ingested {len(records)} layout blocks "
            f"→ {self.output_path}"
        )


if __name__ == "__main__":
    FUNSDIngestion(
        raw_dir=Path("data/raw/FUNSD"),
        output_path=Path("data/interim/funsd_blocks.json"),
    ).run()
