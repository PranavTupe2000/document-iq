import os
from PIL import Image
from PIL import UnidentifiedImageError
import torchvision.transforms as transforms


def preprocess_image(file_path):
    try:
        image = Image.open(file_path).convert("RGB")
    except UnidentifiedImageError as exc:
        size = os.path.getsize(file_path) if os.path.exists(file_path) else -1
        header = b""
        if os.path.exists(file_path):
            with open(file_path, "rb") as f:
                header = f.read(16)
        raise ValueError(
            f"Unsupported/corrupted image at {file_path}. size={size} bytes, header={header.hex()}"
        ) from exc

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
    ])

    return transform(image).unsqueeze(0)
