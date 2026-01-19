# # Data Ingestion
# from document_iq_ml.components.data_ingestion import DataIngestion
# DataIngestion('sample_documents.csv').run()

# # Data Validation
# from document_iq_ml.components.data_validation import DataValidation
# DataValidation().run()

# # Data Transformation
# from document_iq_ml.components.data_transformation import DataTransformation
# DataTransformation().run()

# # Model Training
# from document_iq_ml.components.model_trainer import ModelTrainer
# ModelTrainer().run()

# Model Evaluation
from document_iq_ml.components.model_evaluation import ModelEvaluation
ModelEvaluation().run()