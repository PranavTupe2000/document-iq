import torch.nn as nn
from torchvision import models

from document_iq_core.utils import get_logger

logger = get_logger("LayoutClassifier")


def build_layout_classifier(
    num_classes: int = 4,
    pretrained: bool = True,
):
    logger.info(
        f"Building ResNet18 layout classifier "
        f"(pretrained={pretrained}, classes={num_classes})"
    )

    model = models.resnet18(pretrained=pretrained)

    # Replace final FC layer
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)

    return model
