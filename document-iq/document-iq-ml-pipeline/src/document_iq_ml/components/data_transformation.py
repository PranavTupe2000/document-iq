import re
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
import joblib

from document_iq_core.utils import get_logger, DocumentIQException
from document_iq_ml.artifacts import (
    INGESTED_DATA_PATH,
    PROCESSED_DATA_DIR,
    X_TRAIN_PATH,
    X_VAL_PATH,
    Y_TRAIN_PATH,
    Y_VAL_PATH,
    VECTORIZER_PATH,
)

logger = get_logger("DataTransformation")


class DataTransformation:
    """
    Component responsible for transforming validated data
    into ML-ready features.
    """

    def __init__(
        self,
        input_data_path: Path = INGESTED_DATA_PATH,
        test_size: float = 0.2,
        random_state: int = 42,
        max_features: int = 5000,
    ):
        self.input_data_path = input_data_path
        self.test_size = test_size
        self.random_state = random_state
        self.max_features = max_features

    def _read_data(self) -> pd.DataFrame:
        logger.info(f"Reading data from: {self.input_data_path}")
        if not self.input_data_path.exists():
            raise DocumentIQException(
                f"Ingested data not found at {self.input_data_path}"
            )
        return pd.read_csv(self.input_data_path)

    def _clean_text(self, text: str) -> str:
        """
        Basic text cleaning.
        """
        text = text.lower()
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def _prepare_features(self, df: pd.DataFrame):
        logger.info("Cleaning text data")
        df["clean_text"] = df["text"].astype(str).apply(self._clean_text)

        logger.info("Extracting TF-IDF features")
        vectorizer = TfidfVectorizer(
            max_features=self.max_features,
            ngram_range=(1, 2)
        )

        X = vectorizer.fit_transform(df["clean_text"])
        y = df["label"].values

        return X, y, vectorizer

    def _split_data(self, X, y):
        logger.info("Splitting data into train and validation sets")
        return train_test_split(
            X,
            y,
            test_size=self.test_size,
            random_state=self.random_state,
            stratify=y
        )

    def _save_artifacts(self, X_train, X_val, y_train, y_val, vectorizer):
        PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

        logger.info("Saving transformed datasets")
        np.save(X_TRAIN_PATH, X_train.toarray())
        np.save(X_VAL_PATH, X_val.toarray())
        np.save(Y_TRAIN_PATH, y_train)
        np.save(Y_VAL_PATH, y_val)

        logger.info(f"Saving vectorizer to: {VECTORIZER_PATH}")
        joblib.dump(vectorizer, VECTORIZER_PATH)

    def run(self) -> dict:
        """
        Execute data transformation pipeline.

        Returns:
            dict: paths to transformation artifacts
        """
        logger.info("Starting Data Transformation component")

        df = self._read_data()
        X, y, vectorizer = self._prepare_features(df)
        X_train, X_val, y_train, y_val = self._split_data(X, y)

        self._save_artifacts(X_train, X_val, y_train, y_val, vectorizer)

        logger.info("Data Transformation completed successfully")

        return {
            "X_train": str(X_TRAIN_PATH),
            "X_val": str(X_VAL_PATH),
            "y_train": str(Y_TRAIN_PATH),
            "y_val": str(Y_VAL_PATH),
            "vectorizer": str(VECTORIZER_PATH),
        }
