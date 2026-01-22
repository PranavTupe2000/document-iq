import json
from pathlib import Path
import os

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
from sklearn.metrics import accuracy_score, f1_score
import mlflow
import mlflow.pytorch
import yaml

from document_iq_core.utils import get_logger, DocumentIQException
from document_iq_dl.datasets.funsd_dataset import FUNSDLayoutDataset
from document_iq_dl.models.layout_classifier import build_layout_classifier

logger = get_logger("DLModelEvaluation")
mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI"))


class DLModelEvaluator:
    def __init__(self):
        self.config = self._load_config()
        self.device = torch.device(
            self.config["training"]["device"]
            if torch.cuda.is_available()
            else "cpu"
        )

    def _load_config(self):
        with open("configs/training.yaml", "r") as f:
            return yaml.safe_load(f)

    def run(self):
        logger.info("Starting DL model evaluation")

        model_path = Path("artifacts/model/model.pt")
        if not model_path.exists():
            raise DocumentIQException("Trained model not found")

        dataset = FUNSDLayoutDataset(
            manifest_path=Path("data/processed/blocks_manifest.json")
        )

        train_size = int(0.8 * len(dataset))
        val_size = len(dataset) - train_size

        _, val_ds = random_split(
            dataset,
            [train_size, val_size],
            generator=torch.Generator().manual_seed(42),
        )

        val_loader = DataLoader(
            val_ds,
            batch_size=self.config["training"]["batch_size"],
            shuffle=False,
            num_workers=self.config["training"]["num_workers"],
        )

        model = build_layout_classifier(
            num_classes=self.config["model"]["num_classes"],
            pretrained=False,
        ).to(self.device)

        model.load_state_dict(torch.load(model_path, map_location=self.device))
        model.eval()

        y_true, y_pred = [], []

        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(self.device)
                outputs = model(images)
                preds = outputs.argmax(dim=1).cpu().numpy()

                y_pred.extend(preds)
                y_true.extend(labels.numpy())

        accuracy = accuracy_score(y_true, y_pred)
        macro_f1 = f1_score(y_true, y_pred, average="macro")

        metrics = {
            "accuracy": accuracy,
            "macro_f1": macro_f1,
        }

        # Save evaluation metrics
        output_dir = Path("artifacts/evaluation")
        output_dir.mkdir(parents=True, exist_ok=True)
        with open(output_dir / "evaluation_metrics.json", "w") as f:
            json.dump(metrics, f, indent=4)

        logger.info(f"Evaluation metrics: {metrics}")

        # -------- MLflow Registration --------
        mlflow.set_experiment("document-iq-dl-layout")

        with mlflow.start_run(run_name="model-evaluation"):
            mlflow.log_metrics(metrics)

            mlflow.pytorch.log_model(
                model,
                artifact_path="model",
                registered_model_name="document-iq-layout-classifier",
            )

        logger.info("Model registered successfully")


if __name__ == "__main__":
    DLModelEvaluator().run()
