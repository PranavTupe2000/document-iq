import mlflow

def start_experiment(experiment_name: str):
    mlflow.set_experiment(experiment_name)
    return mlflow.start_run()
