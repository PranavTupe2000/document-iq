from pathlib import Path
import pandas as pd

from document_iq_core.utils import get_logger
from document_iq_core.utils import DocumentIQException
from document_iq_ml.artifacts import (
    RAW_DATA_DIR,
    INTERIM_DATA_DIR,
    INGESTED_DATA_PATH,
)

logger = get_logger("DataIngestion")


class DataIngestion:
    """
    Component responsible for ingesting raw document data
    and producing standardized interim data.
    """

    def __init__(self, raw_file_name: str):
        """
        Args:
            raw_file_name (str): Name of the raw CSV file
        """
        self.raw_file_path = RAW_DATA_DIR / raw_file_name

    def _validate_raw_file(self) -> None:
        """Validate existence of raw data file."""
        if not self.raw_file_path.exists():
            raise DocumentIQException(
                f"Raw data file not found: {self.raw_file_path}"
            )

    def _read_data(self) -> pd.DataFrame:
        """Read raw dataset."""
        logger.info(f"Reading raw data from: {self.raw_file_path}")
        return pd.read_csv(self.raw_file_path)

    def _basic_schema_check(self, df: pd.DataFrame) -> None:
        """
        Perform minimal schema checks.
        Full validation is handled in DataValidation component.
        """
        required_columns = {"document_id", "text", "label"}
        missing = required_columns - set(df.columns)
        if missing:
            raise DocumentIQException(
                f"Missing required columns in raw data: {missing}"
            )

    def _save_interim_data(self, df: pd.DataFrame) -> Path:
        """Save interim ingested dataset."""
        INTERIM_DATA_DIR.mkdir(parents=True, exist_ok=True)

        logger.info(f"Saving ingested data to: {INGESTED_DATA_PATH}")
        df.to_csv(INGESTED_DATA_PATH, index=False)

        return INGESTED_DATA_PATH

    def run(self) -> Path:
        """
        Execute data ingestion pipeline.

        Returns:
            Path: Path to ingested interim data
        """
        logger.info("Starting Data Ingestion component")

        self._validate_raw_file()
        df = self._read_data()
        self._basic_schema_check(df)
        output_path = self._save_interim_data(df)

        logger.info("Data Ingestion completed successfully")
        return output_path
