import mlflow
from document_iq_core.utils import get_logger
from platform_shared.config.settings import Settings

logger = get_logger("LayoutModelLoader")
settings = Settings()


def load_model():
    try:
        mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
        model_uri = "models:/document-iq-layout-classifier@production"
        model = mlflow.pyfunc.load_model(model_uri)
        logger.info("Layout model loaded from MLflow (production alias)")
        return model
    
    except Exception as e:
        logger.error(f"Failed to load layout model: {str(e)}")
        raise
