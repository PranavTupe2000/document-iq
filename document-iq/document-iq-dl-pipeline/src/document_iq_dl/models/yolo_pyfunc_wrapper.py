import mlflow.pyfunc
from ultralytics import YOLO


class YOLOPyFuncWrapper(mlflow.pyfunc.PythonModel):
    """
    MLflow PyFunc wrapper for YOLO layout detector.
    Enables loading via mlflow.pyfunc.load_model().
    """

    def load_context(self, context):
        """
        Load YOLO model from logged artifact.
        """
        model_path = context.artifacts["model_path"]
        self.model = YOLO(model_path)

    def predict(self, context, model_input):
        """
        Perform inference.

        model_input can be:
        - image file path
        - numpy array
        """
        results = self.model(model_input)
        return results