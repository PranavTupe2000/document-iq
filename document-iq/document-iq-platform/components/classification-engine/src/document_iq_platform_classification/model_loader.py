import mlflow
from document_iq_core.utils import get_logger

logger = get_logger("ModelLoader")


def load_model():
    model_uri = "models:/document-classifier/Production"
    model = mlflow.pyfunc.load_model(model_uri)
    logger.info("Classification model loaded from MLflow")
    return model
