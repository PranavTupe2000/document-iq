import json
from pathlib import Path
from PIL import Image
from tqdm import tqdm

from document_iq_core.utils import get_logger, DocumentIQException

logger = get_logger("DLDataTransformation")

IMAGE_SIZE = (224, 224)


class FUNSDDataTransformer:
    def __init__(
        self,
        input_path: Path,
        output_dir: Path,
        manifest_path: Path,
    ):
        self.input_path = input_path
        self.output_dir = output_dir
        self.manifest_path = manifest_path
        self.images_dir = output_dir / "images"

    def run(self):
        logger.info("Starting FUNSD data transformation")

        if not self.input_path.exists():
            raise DocumentIQException(
                f"Transformation input not found: {self.input_path}"
            )

        self.images_dir.mkdir(parents=True, exist_ok=True)

        with open(self.input_path, "r", encoding="utf-8") as f:
            records = json.load(f)

        manifest = []
        block_id = 0

        for record in tqdm(records, desc="Transforming blocks"):
            try:
                img_path = Path(record["image_path"])
                x0, y0, x1, y1 = record["bbox"]
                label = record["label"]

                with Image.open(img_path) as img:
                    img = img.convert("RGB")
                    crop = img.crop((x0, y0, x1, y1))
                    crop = crop.resize(IMAGE_SIZE)

                output_image = self.images_dir / f"block_{block_id:08d}.png"
                crop.save(output_image)

                manifest.append({
                    "image": str(output_image),
                    "label": label,
                })

                block_id += 1

            except Exception:
                continue  # noisy data is expected

        self.manifest_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=4)

        logger.info(
            f"Transformation complete: {len(manifest)} samples created"
        )
        logger.info(f"Processed images → {self.images_dir}")
        logger.info(f"Manifest → {self.manifest_path}")


if __name__ == "__main__":
    FUNSDDataTransformer(
        input_path=Path("data/interim/funsd_blocks.json"),
        output_dir=Path("data/processed"),
        manifest_path=Path("data/processed/blocks_manifest.json"),
    ).run()
