import mlflow

from platform_shared.config.settings import Settings

settings = Settings()

mlflow.set_tracking_uri(settings.mlflow_tracking_uri)

def load_model():
    model_uri = "models:/document-classifier@production"
    return mlflow.pyfunc.load_model(model_uri)
