import mlflow
from mlflow.tracking import MlflowClient

from document_iq_core.utils import get_logger, DocumentIQException

import os
from dotenv import load_dotenv

logger = get_logger("ModelEvaluation")
mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI"))

class ModelEvaluation:
    """
    Selects the best model from nested MLflow runs
    and registers it to MLflow Model Registry.
    """

    def __init__(
        self,
        experiment_name: str = "document-iq-ml-classification",
        metric_name: str = "f1_score",
        model_name: str = "document-iq-ml-classifier",
    ):
        self.experiment_name = experiment_name
        self.metric_name = metric_name
        self.model_name = model_name
        self.client = MlflowClient()

    def _get_experiment_id(self) -> str:
        exp = self.client.get_experiment_by_name(self.experiment_name)
        if exp is None:
            raise DocumentIQException(
                f"Experiment '{self.experiment_name}' not found"
            )
        return exp.experiment_id

    def _get_latest_parent_run(self, experiment_id: str):
        runs = self.client.search_runs(
            experiment_ids=[experiment_id],
            filter_string="attributes.status = 'FINISHED'",
            order_by=["attributes.start_time DESC"],
        )

        for run in runs:
            # Parent run has NO mlflow.parentRunId tag
            if "mlflow.parentRunId" not in run.data.tags:
                return run

        raise DocumentIQException("No parent run found")

    def _get_child_runs(self, experiment_id: str, parent_run_id: str):
        return self.client.search_runs(
            experiment_ids=[experiment_id],
            filter_string=f"tags.mlflow.parentRunId = '{parent_run_id}'",
        )

    def _select_best_run(self, child_runs):
        best_run = None
        best_metric = -1

        for run in child_runs:
            metric_value = run.data.metrics.get(self.metric_name)
            if metric_value is None:
                continue

            if metric_value > best_metric:
                best_metric = metric_value
                best_run = run

        if best_run is None:
            raise DocumentIQException("No valid child runs found")

        return best_run, best_metric

    def _register_and_promote(self, best_run):
        run_id = best_run.info.run_id

        # 🔍 Verify model artifact exists
        artifacts = self.client.list_artifacts(run_id)
        
        # Debug: log all artifacts found
        logger.info(f"Artifacts found in run {run_id}: {[a.path for a in artifacts]}")
        
        model_artifacts = [a for a in artifacts if a.path == "model"]

        if not model_artifacts:
            logger.error(f"Available artifacts: {[a.path for a in artifacts]}")
            raise DocumentIQException(
                f"No model artifact found under run {run_id}. "
                "Ensure mlflow.sklearn.log_model() was called."
            )

        model_uri = f"runs:/{run_id}/model"

        logger.info(f"Registering model from URI: {model_uri}")

        registered_model = mlflow.register_model(
            model_uri=model_uri,
            name=self.model_name,
        )

        version = registered_model.version

        # ✅ Alias-based promotion (modern MLflow)
        self.client.set_registered_model_alias(
            name=self.model_name,
            alias="production",
            version=version,
        )

        return version

    def run(self) -> dict:
        """
        Execute model evaluation and registration.

        Returns:
            dict: Registered model details
        """
        logger.info("Starting Model Evaluation & Registration")

        experiment_id = self._get_experiment_id()
        parent_run = self._get_latest_parent_run(experiment_id)
        child_runs = self._get_child_runs(
            experiment_id, parent_run.info.run_id
        )

        logger.info(
            f"Found {len(child_runs)} child runs under parent {parent_run.info.run_id}"
        )

        best_run, best_metric = self._select_best_run(child_runs)
        model_version = self._register_and_promote(best_run)

        logger.info("Model Evaluation & Registration completed successfully")

        return {
            "experiment_name": self.experiment_name,
            "parent_run_id": parent_run.info.run_id,
            "best_run_id": best_run.info.run_id,
            "best_metric": best_metric,
            "model_name": self.model_name,
            "model_version": model_version,
            "alias": "production",
        }
