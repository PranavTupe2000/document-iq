import json
from pathlib import Path
import os

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
import yaml
import mlflow
import mlflow.pytorch

from document_iq_core.utils import get_logger, DocumentIQException
from document_iq_dl.datasets.funsd_dataset import FUNSDLayoutDataset
from document_iq_dl.models.layout_classifier import build_layout_classifier

logger = get_logger("DLModelTrainer")
mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI"))


class DLModelTrainer:
    def __init__(self):
        self.config = self._load_config()
        self.device = torch.device(
            self.config["training"]["device"]
            if torch.cuda.is_available()
            else "cpu"
        )

    def _load_config(self):
        config_path = Path("configs/training.yaml")
        if not config_path.exists():
            raise DocumentIQException("Training config not found")
        with open(config_path, "r") as f:
            return yaml.safe_load(f)

    def run(self):
        logger.info("Starting DL model training")

        dataset = FUNSDLayoutDataset(
            manifest_path=Path("data/processed/blocks_manifest.json")
        )

        train_size = int(0.8 * len(dataset))
        val_size = len(dataset) - train_size

        train_ds, val_ds = random_split(
            dataset,
            [train_size, val_size],
            generator=torch.Generator().manual_seed(42),
        )

        train_loader = DataLoader(
            train_ds,
            batch_size=self.config["training"]["batch_size"],
            shuffle=True,
            num_workers=self.config["training"]["num_workers"],
        )

        val_loader = DataLoader(
            val_ds,
            batch_size=self.config["training"]["batch_size"],
            shuffle=False,
            num_workers=self.config["training"]["num_workers"],
        )

        model = build_layout_classifier(
            num_classes=self.config["model"]["num_classes"],
            pretrained=self.config["model"]["pretrained"],
        ).to(self.device)

        criterion = nn.CrossEntropyLoss()
        optimizer = torch.optim.Adam(
            model.parameters(),
            lr=self.config["training"]["learning_rate"],
            weight_decay=self.config["training"]["weight_decay"],
        )

        mlflow.set_experiment("document-iq-dl-layout")

        with mlflow.start_run():
            mlflow.log_params({
                "batch_size": self.config["training"]["batch_size"],
                "epochs": self.config["training"]["num_epochs"],
                "learning_rate": self.config["training"]["learning_rate"],
                "model": self.config["model"]["name"],
            })

            best_val_loss = float("inf")

            for epoch in range(self.config["training"]["num_epochs"]):
                train_loss = self._train_one_epoch(
                    model, train_loader, criterion, optimizer
                )
                val_loss, val_acc = self._validate(
                    model, val_loader, criterion
                )

                mlflow.log_metrics(
                    {
                        "train_loss": train_loss,
                        "val_loss": val_loss,
                        "val_accuracy": val_acc,
                    },
                    step=epoch,
                )

                logger.info(
                    f"Epoch {epoch+1}: "
                    f"train_loss={train_loss:.4f}, "
                    f"val_loss={val_loss:.4f}, "
                    f"val_acc={val_acc:.4f}"
                )

                if val_loss < best_val_loss:
                    best_val_loss = val_loss
                    self._save_model(model)

            mlflow.pytorch.log_model(model, artifact_path="model")

        logger.info("Training completed successfully")

    def _train_one_epoch(self, model, loader, criterion, optimizer):
        model.train()
        total_loss = 0.0

        for images, labels in loader:
            images, labels = images.to(self.device), labels.to(self.device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

        return total_loss / len(loader)

    def _validate(self, model, loader, criterion):
        model.eval()
        total_loss = 0.0
        correct = 0
        total = 0

        with torch.no_grad():
            for images, labels in loader:
                images, labels = images.to(self.device), labels.to(self.device)
                outputs = model(images)
                loss = criterion(outputs, labels)

                total_loss += loss.item()
                preds = outputs.argmax(dim=1)
                correct += (preds == labels).sum().item()
                total += labels.size(0)

        return total_loss / len(loader), correct / total

    def _save_model(self, model):
        output_dir = Path("artifacts/model")
        output_dir.mkdir(parents=True, exist_ok=True)

        torch.save(model.state_dict(), output_dir / "model.pt")

        with open(output_dir / "label_mapping.json", "w") as f:
            json.dump(
                self.config["labels"]["mapping"], f, indent=4
            )

        logger.info("Best model saved")


if __name__ == "__main__":
    DLModelTrainer().run()
