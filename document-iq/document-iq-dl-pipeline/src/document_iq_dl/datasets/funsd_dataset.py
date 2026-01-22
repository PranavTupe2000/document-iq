import json
from pathlib import Path
from PIL import Image

import torch
from torch.utils.data import Dataset
from torchvision import transforms

from document_iq_core.utils import get_logger, DocumentIQException

logger = get_logger("FUNSDDataset")

LABEL2ID = {
    "header": 0,
    "question": 1,
    "answer": 2,
    "other": 3,
}


class FUNSDLayoutDataset(Dataset):
    def __init__(
        self,
        manifest_path: Path,
        transform=None,
    ):
        if not manifest_path.exists():
            raise DocumentIQException(
                f"Manifest not found: {manifest_path}"
            )

        with open(manifest_path, "r", encoding="utf-8") as f:
            self.samples = json.load(f)

        self.transform = transform or self._default_transforms()

        logger.info(
            f"Loaded FUNSD dataset with {len(self.samples)} samples"
        )

    def _default_transforms(self):
        return transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ])

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        sample = self.samples[idx]

        image_path = Path(sample["image"])
        label_str = sample["label"]

        if label_str not in LABEL2ID:
            raise DocumentIQException(
                f"Unknown label: {label_str}"
            )

        label = LABEL2ID[label_str]

        try:
            image = Image.open(image_path).convert("RGB")
        except Exception as e:
            raise DocumentIQException(
                f"Failed to load image: {image_path}"
            ) from e

        if self.transform:
            image = self.transform(image)

        return image, torch.tensor(label, dtype=torch.long)
