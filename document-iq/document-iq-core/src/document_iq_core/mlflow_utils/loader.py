import mlflow.pyfunc

def load_production_model(model_name: str):
    model_uri = f"models:/{model_name}/Production"
    return mlflow.pyfunc.load_model(model_uri)
