import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import LinearSVC
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import f1_score, accuracy_score
from xgboost import XGBClassifier


import mlflow
import mlflow.sklearn

from sklearn.preprocessing import LabelEncoder
import joblib
import os
from dotenv import load_dotenv

from document_iq_ml.artifacts import LABEL_ENCODER_PATH
from document_iq_core.utils import get_logger, DocumentIQException
from document_iq_ml.artifacts import (
    X_TRAIN_PATH,
    X_VAL_PATH,
    Y_TRAIN_PATH,
    Y_VAL_PATH,
)
load_dotenv()
logger = get_logger("ModelTrainer")

mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI"))

class ModelTrainer:
    """
    Trains multiple ML models using GridSearchCV
    and tracks experiments using nested MLflow runs.
    """

    def __init__(
        self,
        experiment_name: str = "document-iq-ml-classification",
        random_state: int = 42,
    ):
        self.experiment_name = experiment_name
        self.random_state = random_state

    def _load_data(self):
        if not X_TRAIN_PATH.exists():
            raise DocumentIQException("Transformed data not found")

        X_train = np.load(X_TRAIN_PATH)
        X_val = np.load(X_VAL_PATH)
        y_train = np.load(Y_TRAIN_PATH, allow_pickle=True)
        y_val = np.load(Y_VAL_PATH, allow_pickle=True)

        return X_train, X_val, y_train, y_val

    def _evaluate(self, model, X_val, y_val):
        preds = model.predict(X_val)
        return {
            "accuracy": accuracy_score(y_val, preds),
            "f1_score": f1_score(y_val, preds, average="weighted"),
        }

    def _run_gridsearch(
        self,
        model_name: str,
        estimator,
        param_grid,
        X_train,
        y_train,
        X_val,
        y_val,
        requires_label_encoding: bool = False,
    ):
        logger.info(f"Running GridSearchCV for {model_name}")

        # ---- Label encoding (ONLY if required) ----
        label_encoder = None
        if requires_label_encoding:
            logger.info(f"Encoding labels for {model_name}")
            label_encoder = LabelEncoder()
            y_train = label_encoder.fit_transform(y_train)
            y_val = label_encoder.transform(y_val)

            # Save encoder
            joblib.dump(label_encoder, LABEL_ENCODER_PATH)

            # Log mapping
            label_mapping = {
                int(idx): label
                for idx, label in enumerate(label_encoder.classes_)
            }
            mlflow.log_dict(label_mapping, "label_mapping.json")

        grid = GridSearchCV(
            estimator=estimator,
            param_grid=param_grid,
            scoring="f1_weighted",
            cv=3,
            n_jobs=-1,
            error_score="raise",   # fail fast (good practice)
        )

        grid.fit(X_train, y_train)

        best_model = grid.best_estimator_
        preds = best_model.predict(X_val)

        metrics = {
            "accuracy": accuracy_score(y_val, preds),
            "f1_score": f1_score(y_val, preds, average="weighted"),
        }

        mlflow.log_params(grid.best_params_)
        mlflow.log_metrics(metrics)
        mlflow.sklearn.log_model(best_model, name="model")

        return {
            "model_name": model_name,
            "best_params": grid.best_params_,
            "metrics": metrics,
        }

    def run(self) -> dict:
        logger.info("Starting Model Training with GridSearchCV")

        X_train, X_val, y_train, y_val = self._load_data()
        mlflow.set_experiment(self.experiment_name)

        best_overall = {
            "model_name": None,
            "metrics": {"f1_score": -1},
            "params": None,
        }

        with mlflow.start_run() as parent_run:
            mlflow.log_param("pipeline_stage", "model_training")

            algorithms = [
                (
                    "logistic_regression",
                    LogisticRegression(max_iter=1000),
                    {
                        "C": [0.1, 1.0, 10],
                        "solver": ["lbfgs"],
                    },
                    False,
                ),
                (
                    "random_forest",
                    RandomForestClassifier(random_state=self.random_state),
                    {
                        "n_estimators": [100, 200],
                        "max_depth": [None, 20],
                    },
                    False,
                ),
                # (
                #     "linear_svm",
                #     LinearSVC(),
                #     {
                #         "C": [0.1, 1.0, 10],
                #     },
                #     False,
                # ),
                # (
                #     "gradient_boosting",
                #     GradientBoostingClassifier(random_state=self.random_state),
                #     {
                #         "n_estimators": [100, 200],
                #         "learning_rate": [0.05, 0.1],
                #     },
                #     False,
                # ),
                # (
                #     "xgboost",
                #     XGBClassifier(
                #         objective="multi:softprob",
                #         eval_metric="mlogloss",
                #         random_state=self.random_state,
                #         n_jobs=-1,
                #     ),
                #     {
                #         "n_estimators": [100, 200],
                #         "max_depth": [3, 6],
                #         "learning_rate": [0.05, 0.1],
                #         "subsample": [0.8, 1.0],
                #     },
                #     True,   # requires label encoding
                # ),
            ]


            for name, model, param_grid, requires_encoding in algorithms:
                with mlflow.start_run(run_name=name, nested=True):
                    result = self._run_gridsearch(
                        name,
                        model,
                        param_grid,
                        X_train,
                        y_train,
                        X_val,
                        y_val,
                        requires_label_encoding=requires_encoding,
                    )


                    if result["metrics"]["f1_score"] > best_overall["metrics"]["f1_score"]:
                        best_overall = {
                            "model_name": name,
                            "metrics": result["metrics"],
                            "params": result["best_params"],
                        }

            # Log BEST MODEL SUMMARY in PARENT RUN
            mlflow.log_param("best_model", best_overall["model_name"])
            mlflow.log_metrics({
                "best_accuracy": best_overall["metrics"]["accuracy"],
                "best_f1_score": best_overall["metrics"]["f1_score"],
            })

            for k, v in best_overall["params"].items():
                mlflow.log_param(f"best_{k}", v)

        logger.info("Model Training completed successfully")
        return best_overall
