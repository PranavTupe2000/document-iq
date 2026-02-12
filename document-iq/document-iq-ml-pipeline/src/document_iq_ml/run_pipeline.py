import os
import mlflow
import mlflow.sklearn
from dotenv import load_dotenv

from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer

from document_iq_core.utils import get_logger, DocumentIQException

# Pipeline Components
from document_iq_ml.components.data_ingestion import DataIngestion
from document_iq_ml.components.data_validation import DataValidation
from document_iq_ml.components.data_transformation import DataTransformation
from document_iq_ml.components.model_trainer import ModelTrainer
from document_iq_ml.components.model_evaluation import ModelEvaluation

# Artifacts
from document_iq_ml.artifacts import INGESTED_DATA_PATH


load_dotenv()

logger = get_logger("MLPipelineRunner")

mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI"))


class DocumentIQPipeline:

    def __init__(
        self,
        experiment_name: str = "document-iq-full-pipeline",
        registered_model_name: str = "document-classifier",
    ):
        self.experiment_name = experiment_name
        self.registered_model_name = registered_model_name

    def run(self):

        logger.info("========== Starting DocumentIQ ML Pipeline ==========")

        mlflow.set_experiment(self.experiment_name)

        with mlflow.start_run(run_name="full_pipeline"):

            # ----------------------------------
            # 1️⃣ Data Ingestion
            # ----------------------------------
            logger.info("Running Data Ingestion")

            ingestion = DataIngestion("sample_documents.csv")
            ingestion_path = ingestion.run()

            mlflow.log_param("ingestion_path", ingestion_path)


            # ----------------------------------
            # 2️⃣ Data Validation
            # ----------------------------------
            logger.info("Running Data Validation")

            validation = DataValidation()
            validation_artifacts = validation.run()

            mlflow.log_param("validation_status", "passed")


            # ----------------------------------
            # 3️⃣ Data Transformation
            # ----------------------------------
            logger.info("Running Data Transformation")

            transformer = DataTransformation()
            transform_artifacts = transformer.run()

            mlflow.log_params({
                "tfidf_max_features": transformer.max_features,
                "test_size": transformer.test_size,
            })


            # ----------------------------------
            # 4️⃣ Model Training
            # ----------------------------------
            logger.info("Running Model Training")

            trainer = ModelTrainer()
            training_result = trainer.run()

            best_model = training_result["model"]

            if best_model is None:
                raise DocumentIQException("Training failed. No model produced.")


            # ----------------------------------
            # 5️⃣ Model Evaluation
            # ----------------------------------
            logger.info("Running Model Evaluation")

            evaluator = ModelEvaluation()
            eval_metrics = evaluator.run()
            clean_metrics = {
                k: float(v)
                for k, v in eval_metrics.items()
                if isinstance(v, (int, float))
            }
            mlflow.log_metrics(clean_metrics)


            # ----------------------------------
            # 6️⃣ Build FULL Pipeline (Vectorizer + Model)
            # ----------------------------------
            logger.info("Building Full Inference Pipeline")

            pipeline = Pipeline([
                (
                    "tfidf",
                    TfidfVectorizer(
                        max_features=transformer.max_features,
                        ngram_range=(1, 2),
                    )
                ),
                ("classifier", best_model),
            ])


            # ----------------------------------
            # 7️⃣ Retrain Pipeline on FULL DATA
            # ----------------------------------
            logger.info("Fitting pipeline on full dataset")

            import pandas as pd

            df = pd.read_csv(INGESTED_DATA_PATH)

            X = df["text"].astype(str)
            y = df["label"]

            pipeline.fit(X, y)


            # ----------------------------------
            # 8️⃣ Log & Register Pipeline
            # ----------------------------------
            logger.info("Logging full pipeline to MLflow")

            mlflow.sklearn.log_model(
                sk_model=pipeline,
                artifact_path="pipeline_model",
                registered_model_name=self.registered_model_name,
                input_example=["sample document text"],
            )


            # ----------------------------------
            # 9️⃣ Metadata
            # ----------------------------------
            mlflow.log_param("final_model", training_result["model_name"])
            mlflow.log_param("pipeline_type", "tfidf+sklearn")


        logger.info("========== Pipeline Completed Successfully ==========")


if __name__ == "__main__":
    runner = DocumentIQPipeline()
    runner.run()
