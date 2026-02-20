import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

import mlflow
from mlflow.tracking import MlflowClient
from ultralytics import YOLO


# Ensure project root in path
PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))


class YOLOModelEvaluation:
    """
    Performs advanced evaluation of trained YOLO model.
    Logs metrics, confusion matrix, per-class AP,
    and promotes model to production alias.
    """

    def __init__(self):
        load_dotenv()

        self.artifacts_dir = PROJECT_ROOT / "artifacts" / "yolo_model"
        self.dataset_yaml_path = PROJECT_ROOT / "data" / "yolo" / "data.yaml"
        self.model_path = self.artifacts_dir / "best.pt"

        self.metrics_output_path = self.artifacts_dir / "evaluation_metrics.json"

        self.model_name = "document-iq-layout-detector"

        mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI"))
        mlflow.set_experiment("document-iq-dl-layout-yolo-eval")

    def run(self):
        print("Starting YOLO Evaluation Stage...")

        if not self.model_path.exists():
            raise FileNotFoundError("Trained model not found. Run training first.")

        model = YOLO(str(self.model_path))

        with mlflow.start_run(run_name="yolo_evaluation"):

            # -------------------------
            # Run Validation
            # -------------------------
            results = model.val(
                data=str(self.dataset_yaml_path),
                split="val",
                imgsz=512,
                device="cpu",
                save=True,
                save_json=True,
                project=str(self.artifacts_dir),
                name="evaluation_run",
                exist_ok=True
            )

            metrics = results.results_dict

            # -------------------------
            # Extract Key Metrics
            # -------------------------
            evaluation_metrics = {
                "mAP50": metrics.get("metrics/mAP50(B)", 0.0),
                "mAP50_95": metrics.get("metrics/mAP50-95(B)", 0.0),
                "precision": metrics.get("metrics/precision(B)", 0.0),
                "recall": metrics.get("metrics/recall(B)", 0.0),
            }

            # Per-class AP
            per_class_ap = results.box.ap50  # list of AP per class
            evaluation_metrics["per_class_AP50"] = per_class_ap.tolist() if per_class_ap is not None else []

            # Save metrics JSON
            with open(self.metrics_output_path, "w") as f:
                json.dump(evaluation_metrics, f, indent=4)

            # -------------------------
            # Log to MLflow
            # -------------------------
            mlflow.log_metrics({
                "eval_mAP50": evaluation_metrics["mAP50"],
                "eval_mAP50_95": evaluation_metrics["mAP50_95"],
                "eval_precision": evaluation_metrics["precision"],
                "eval_recall": evaluation_metrics["recall"],
            })

            mlflow.log_artifact(str(self.metrics_output_path), artifact_path="evaluation")

            # Log confusion matrix image if exists
            confusion_matrix_path = (
                self.artifacts_dir / "evaluation_run" / "confusion_matrix.png"
            )

            if confusion_matrix_path.exists():
                mlflow.log_artifact(str(confusion_matrix_path), artifact_path="evaluation")

        print("Evaluation completed.")
        print(json.dumps(evaluation_metrics, indent=4))

        # -------------------------
        # Promote Model to Production
        # -------------------------
        self._promote_to_production()

    def _promote_to_production(self):
        print("Promoting model to 'production' alias...")

        client = MlflowClient()

        # Get latest model version
        versions = client.search_model_versions(f"name='{self.model_name}'")

        if not versions:
            print("No registered model versions found.")
            return

        latest_version = max(versions, key=lambda v: int(v.version))

        client.set_registered_model_alias(
            name=self.model_name,
            alias="production",
            version=latest_version.version
        )

        print(f"Model version {latest_version.version} set to production.")


if __name__ == "__main__":
    evaluator = YOLOModelEvaluation()
    evaluator.run()