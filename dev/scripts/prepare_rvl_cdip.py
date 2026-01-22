import csv
import pytesseract
from pathlib import Path
from PIL import Image
from tqdm import tqdm

DATASET_DIR = Path("data/rvl-cdip/images")
OUTPUT_PATH = Path("data/rvl_cdip_subset.csv")

ALLOWED_LABELS = ["invoice", "letter", "form", "email", "resume"]
MAX_SAMPLES_PER_CLASS = 200

OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

rows = []

def ocr_image(img_path):
    image = Image.open(img_path)

    # Handle multi-page TIFFs
    if getattr(image, "n_frames", 1) > 1:
        image.seek(0)

    # Convert + resize (CRITICAL)
    image = image.convert("L")
    image = image.resize(
        (image.width // 2, image.height // 2)
    )

    custom_config = r"--oem 3 --psm 6"
    text = pytesseract.image_to_string(
        image, config=custom_config
    )

    return text


for label in ALLOWED_LABELS:
    images = list((DATASET_DIR / label).glob("*.tif"))[:MAX_SAMPLES_PER_CLASS]
    for img_path in tqdm(images, desc=f"OCR {label}"):
        try:
            text = ocr_image(img_path)

            if not text or len(text.strip()) < 50:
                continue

            rows.append([
                img_path.stem,
                text.replace("\n", " "),
                label
            ])
        except Exception:
            continue

with open(OUTPUT_PATH, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["document_id", "text", "label"])
    writer.writerows(rows)

print(f"Saved {len(rows)} samples to {OUTPUT_PATH}")
