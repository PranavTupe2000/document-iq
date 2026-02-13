from PIL import Image
import torchvision.transforms as transforms


def preprocess_image(file_path):
    image = Image.open(file_path).convert("RGB")

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
    ])

    return transform(image).unsqueeze(0)
