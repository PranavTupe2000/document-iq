import json
import shutil
from pathlib import Path
from typing import List, Dict
from PIL import Image


CLASS_MAPPING: Dict[str, int] = {
    "header": 0,
    "question": 1,
    "answer": 2,
    "other": 3,
}


class FUNSDToYOLOConverter:
    """
    Converts FUNSD dataset into YOLO object detection format.

    Expected raw structure:
    data/raw/FUNSD/
        ├── training_data/
        │   ├── images/
        │   └── annotations/
        └── testing_data/
            ├── images/
            └── annotations/

    Output structure:
    data/yolo/
        ├── images/
        │   ├── train/
        │   └── val/
        ├── labels/
        │   ├── train/
        │   └── val/
        └── data.yaml
    """

    def __init__(self, raw_data_dir: Path, output_dir: Path):
        self.raw_data_dir = Path(raw_data_dir)
        self.output_dir = Path(output_dir)

        self.images_output = self.output_dir / "images"
        self.labels_output = self.output_dir / "labels"

    def convert(self):
        """
        Main entrypoint.
        Automatically detects dataset splits.
        """

        if not self.raw_data_dir.exists():
            raise FileNotFoundError(
                f"Raw dataset directory not found: {self.raw_data_dir}"
            )

        # Clean output directory if exists
        if self.output_dir.exists():
            shutil.rmtree(self.output_dir)

        print("Starting FUNSD → YOLO conversion...")

        for split_dir in self.raw_data_dir.iterdir():
            if not split_dir.is_dir():
                continue

            self._process_split(split_dir.name)

        self._create_data_yaml()

        print("Conversion completed successfully.")

    def _process_split(self, split_name: str):
        """
        Process a dataset split dynamically.
        """

        images_dir = self.raw_data_dir / split_name / "images"
        annotations_dir = self.raw_data_dir / split_name / "annotations"

        if not images_dir.exists() or not annotations_dir.exists():
            print(f"Skipping invalid split: {split_name}")
            return

        # Map training/testing to YOLO standard
        yolo_split = "train" if "train" in split_name.lower() else "val"

        (self.images_output / yolo_split).mkdir(parents=True, exist_ok=True)
        (self.labels_output / yolo_split).mkdir(parents=True, exist_ok=True)

        annotation_files = list(annotations_dir.glob("*.json"))

        print(f"Processing {split_name} → {yolo_split} ({len(annotation_files)} files)")

        for annotation_file in annotation_files:
            self._process_single_annotation(
                annotation_file, images_dir, yolo_split
            )

    def _process_single_annotation(
        self,
        annotation_file: Path,
        images_dir: Path,
        yolo_split: str,
    ):
        image_stem = annotation_file.stem

        # Support multiple image extensions safely
        possible_extensions = [".png", ".jpg", ".jpeg"]
        image_path = None

        for ext in possible_extensions:
            candidate = images_dir / f"{image_stem}{ext}"
            if candidate.exists():
                image_path = candidate
                break

        if image_path is None:
            print(f"Image not found for annotation: {annotation_file.name}")
            return

        output_image_path = (
            self.images_output / yolo_split / image_path.name
        )

        shutil.copy(image_path, output_image_path)

        self._create_label_file(
            annotation_file,
            output_image_path,
            yolo_split,
        )

    def _create_label_file(
        self,
        annotation_file: Path,
        image_path: Path,
        yolo_split: str,
    ):
        with open(annotation_file, "r", encoding="utf-8") as f:
            annotation = json.load(f)

        img = Image.open(image_path)
        img_width, img_height = img.size

        label_lines: List[str] = []

        for item in annotation.get("form", []):
            label = item.get("label", "").lower()
            bbox = item.get("box", [])

            if label not in CLASS_MAPPING or len(bbox) != 4:
                continue

            class_id = CLASS_MAPPING[label]

            x0, y0, x1, y1 = bbox

            width = x1 - x0
            height = y1 - y0
            center_x = x0 + width / 2
            center_y = y0 + height / 2

            # Normalize to YOLO format
            center_x /= img_width
            center_y /= img_height
            width /= img_width
            height /= img_height

            label_lines.append(
                f"{class_id} {center_x:.6f} {center_y:.6f} "
                f"{width:.6f} {height:.6f}"
            )

        label_file_path = (
            self.labels_output / yolo_split / f"{annotation_file.stem}.txt"
        )

        with open(label_file_path, "w") as f:
            f.write("\n".join(label_lines))

    def _create_data_yaml(self):
        data_yaml_path = self.output_dir / "data.yaml"

        content = f"""
path: {self.output_dir.resolve()}
train: images/train
val: images/val

names:
  0: header
  1: question
  2: answer
  3: other
"""

        with open(data_yaml_path, "w") as f:
            f.write(content.strip())