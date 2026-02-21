# src/document_iq_dl/components/yolo_model_trainer.py

import os
import sys
import shutil
from pathlib import Path
from document_iq_dl.models.yolo_pyfunc_wrapper import YOLOPyFuncWrapper
import yaml
from dotenv import load_dotenv

import mlflow
from ultralytics import YOLO


# Ensure project root in path
PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))


class YOLOModelTrainer:
    """
    Trains YOLO model using CPU configuration
    and logs everything to MLflow.
    """

    def __init__(self):
        load_dotenv()

        self.config = self._load_config()
        self.dataset_yaml_path = PROJECT_ROOT / "data" / "yolo" / "data.yaml"
        self.artifacts_dir = PROJECT_ROOT / "artifacts" / "yolo_model"
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)

        # MLflow setup
        mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI"))
        mlflow.set_experiment(self.config["mlflow"]["experiment_name"])

    def _load_config(self):
        config_path = PROJECT_ROOT / "configs" / "yolo_training.yaml"
        with open(config_path, "r") as f:
            return yaml.safe_load(f)

    def run(self):
        print("Starting YOLO Training Stage...")

        base_model = self.config["model"]["base_model"]
        epochs = self.config["training"]["epochs"]
        batch_size = self.config["training"]["batch_size"]
        img_size = self.config["training"]["img_size"]
        device = self.config["training"]["device"]
        workers = self.config["training"]["workers"]
        patience = self.config["training"]["patience"]

        with mlflow.start_run():

            # -------------------------
            # Log Hyperparameters
            # -------------------------
            mlflow.log_params({
                "base_model": base_model,
                "epochs": epochs,
                "batch_size": batch_size,
                "img_size": img_size,
                "device": device,
                "patience": patience,
            })

            # -------------------------
            # Initialize YOLO Model
            # -------------------------
            model = YOLO(base_model)

            # -------------------------
            # Train Model
            # -------------------------
            results = model.train(
                data=str(self.dataset_yaml_path),
                epochs=epochs,
                batch=batch_size,
                imgsz=img_size,
                device=device,
                workers=workers,
                project=str(self.artifacts_dir),
                name="training_run",
                exist_ok=True,
                verbose=True,
                patience=patience,
            )

            # -------------------------
            # Extract Metrics
            # -------------------------
            metrics = results.results_dict

            mAP50 = metrics.get("metrics/mAP50(B)", 0.0)
            mAP5095 = metrics.get("metrics/mAP50-95(B)", 0.0)
            precision = metrics.get("metrics/precision(B)", 0.0)
            recall = metrics.get("metrics/recall(B)", 0.0)

            mlflow.log_metrics({
                "mAP50": mAP50,
                "mAP50_95": mAP5095,
                "precision": precision,
                "recall": recall,
            })

            # -------------------------
            # Save Best Model
            # -------------------------
            best_weights_path = (
                Path(results.save_dir) / "weights" / "best.pt"
            )

            final_model_path = self.artifacts_dir / "best.pt"
            shutil.copy(best_weights_path, final_model_path)

            # Log PyFunc Model
            mlflow.pyfunc.log_model(
                artifact_path="layout_detector",
                python_model=YOLOPyFuncWrapper(),
                artifacts={"model_path": str(final_model_path)},
                registered_model_name=self.config["mlflow"]["registered_model_name"]
            )

        print("YOLO Training Completed Successfully.")
        print(f"Model saved at: {final_model_path}")


if __name__ == "__main__":
    trainer = YOLOModelTrainer()
    trainer.run()