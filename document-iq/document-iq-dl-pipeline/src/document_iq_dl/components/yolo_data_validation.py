import json
from pathlib import Path
import sys
from collections import defaultdict

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))


class YOLODataTransformation:
    """
    Validates YOLO dataset and generates dataset analysis report.
    """

    def __init__(self):
        self.dataset_dir = PROJECT_ROOT / "data" / "yolo"
        self.artifacts_dir = PROJECT_ROOT / "artifacts" / "dataset"
        self.images_dir = self.dataset_dir / "images"
        self.labels_dir = self.dataset_dir / "labels"

        self.artifacts_dir.mkdir(parents=True, exist_ok=True)

        self.class_names = {
            0: "header",
            1: "question",
            2: "answer",
            3: "other",
        }

    def run(self):
        print("Starting YOLO Data Transformation Stage...")

        report = {
            "total_images": 0,
            "total_labels": 0,
            "class_distribution": defaultdict(int),
            "empty_label_files": 0,
            "invalid_entries": 0,
        }

        for split in ["train", "val"]:
            split_images = list((self.images_dir / split).glob("*"))
            split_labels = list((self.labels_dir / split).glob("*.txt"))

            report["total_images"] += len(split_images)

            # Validate image-label pairing
            image_stems = {img.stem for img in split_images}
            label_stems = {lbl.stem for lbl in split_labels}

            missing_labels = image_stems - label_stems
            missing_images = label_stems - image_stems

            if missing_labels:
                print(f"[WARNING] Missing labels for images: {missing_labels}")

            if missing_images:
                print(f"[WARNING] Missing images for labels: {missing_images}")

            for label_file in split_labels:
                lines = label_file.read_text().strip().split("\n")

                if lines == [""] or not lines:
                    report["empty_label_files"] += 1
                    continue

                for line in lines:
                    parts = line.strip().split()

                    if len(parts) != 5:
                        report["invalid_entries"] += 1
                        continue

                    class_id, cx, cy, w, h = parts

                    try:
                        class_id = int(class_id)
                        cx, cy, w, h = map(float, [cx, cy, w, h])
                    except ValueError:
                        report["invalid_entries"] += 1
                        continue

                    # Validate normalization
                    if not (0 <= cx <= 1 and 0 <= cy <= 1 and
                            0 <= w <= 1 and 0 <= h <= 1):
                        report["invalid_entries"] += 1
                        continue

                    report["class_distribution"][class_id] += 1
                    report["total_labels"] += 1

        # Convert defaultdict to normal dict
        report["class_distribution"] = {
            self.class_names.get(k, str(k)): v
            for k, v in report["class_distribution"].items()
        }

        # Save report
        report_path = self.artifacts_dir / "dataset_report.json"
        with open(report_path, "w") as f:
            json.dump(report, f, indent=4)

        print("Dataset validation completed.")
        print(f"Report saved to: {report_path}")
        print(json.dumps(report, indent=4))


if __name__ == "__main__":
    transformation = YOLODataTransformation()
    transformation.run()