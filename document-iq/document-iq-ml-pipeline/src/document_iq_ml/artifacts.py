from pathlib import Path

# Project root
ROOT_DIR = Path(__file__).resolve().parents[1]

# Data directories
DATA_DIR = ROOT_DIR / "../data"
RAW_DATA_DIR = DATA_DIR / "raw"
INTERIM_DATA_DIR = DATA_DIR / "interim"
PROCESSED_DATA_DIR = DATA_DIR / "processed"

# Artifacts
ARTIFACTS_DIR = ROOT_DIR / "../artifacts"
ARTIFACTS_DIR.mkdir(exist_ok=True)

# Ingestion artifacts
INGESTED_DATA_PATH = INTERIM_DATA_DIR / "ingested_data.csv"

# Validation artifacts
VALIDATION_REPORT_PATH = ARTIFACTS_DIR / "data_validation_report.json"

# Transformation artifacts
X_TRAIN_PATH = PROCESSED_DATA_DIR / "X_train.npy"
X_VAL_PATH = PROCESSED_DATA_DIR / "X_val.npy"
Y_TRAIN_PATH = PROCESSED_DATA_DIR / "y_train.npy"
Y_VAL_PATH = PROCESSED_DATA_DIR / "y_val.npy"

VECTORIZER_PATH = ARTIFACTS_DIR / "tfidf_vectorizer.pkl"

# Model training artifacts
MODEL_DIR = ARTIFACTS_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

TRAINED_MODEL_PATH = MODEL_DIR / "trained_model.pkl"

# Label encoder artifact
LABEL_ENCODER_PATH = ARTIFACTS_DIR / "label_encoder.pkl"
