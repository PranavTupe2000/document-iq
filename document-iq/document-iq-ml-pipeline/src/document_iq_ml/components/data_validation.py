import json
from pathlib import Path
import pandas as pd

from document_iq_core.utils import get_logger
from document_iq_core.utils import DocumentIQException
from document_iq_ml.artifacts import (
    INGESTED_DATA_PATH,
    VALIDATION_REPORT_PATH,
)

logger = get_logger("DataValidation")


class DataValidation:
    """
    Component responsible for validating ingested data
    before transformation and training.
    """

    def __init__(self, input_data_path: Path = INGESTED_DATA_PATH):
        self.input_data_path = input_data_path

    def _read_data(self) -> pd.DataFrame:
        logger.info(f"Reading ingested data from: {self.input_data_path}")
        if not self.input_data_path.exists():
            raise DocumentIQException(
                f"Ingested data not found at {self.input_data_path}"
            )
        return pd.read_csv(self.input_data_path)

    def _check_missing_values(self, df: pd.DataFrame) -> dict:
        missing_report = {
            col: int(count)
            for col, count in df.isnull().sum().to_dict().items()
        }

        has_missing = bool(any(count > 0 for count in missing_report.values()))

        return {
            "missing_values": missing_report,
            "has_missing": has_missing
        }

    def _check_empty_strings(self, df: pd.DataFrame) -> dict:
        empty_text_count = int((df["text"].str.strip() == "").sum())

        return {
            "empty_text_rows": empty_text_count,
            "has_empty_text": bool(empty_text_count > 0)
        }

    def _check_class_distribution(self, df: pd.DataFrame) -> dict:
        class_counts = {
            label: int(count)
            for label, count in df["label"].value_counts().to_dict().items()
        }

        total = int(len(df))

        distribution = {
            label: round(count / total, 4)
            for label, count in class_counts.items()
        }

        return {
            "class_counts": class_counts,
            "class_distribution": distribution
        }

    def _validate_minimum_rows(self, df: pd.DataFrame, min_rows: int = 10) -> bool:
        return bool(len(df) >= min_rows)


    def _generate_report(self, report: dict) -> None:
        VALIDATION_REPORT_PATH.parent.mkdir(exist_ok=True)

        logger.info(f"Saving validation report to: {VALIDATION_REPORT_PATH}")
        with open(VALIDATION_REPORT_PATH, "w") as f:
            json.dump(report, f, indent=4)

    def run(self) -> dict:
        """
        Execute data validation checks.

        Returns:
            dict: Validation report
        """
        logger.info("Starting Data Validation component")

        df = self._read_data()

        report = {
            "row_count": len(df),
            "missing_check": self._check_missing_values(df),
            "empty_text_check": self._check_empty_strings(df),
            "class_distribution": self._check_class_distribution(df),
            "meets_minimum_rows": self._validate_minimum_rows(df),
            "status": "PASS"
        }

        # Fail-fast conditions
        if report["missing_check"]["has_missing"]:
            report["status"] = "FAIL"
        if report["empty_text_check"]["has_empty_text"]:
            report["status"] = "FAIL"
        if not report["meets_minimum_rows"]:
            report["status"] = "FAIL"

        self._generate_report(report)

        if report["status"] == "FAIL":
            raise DocumentIQException(
                "Data validation failed. Check validation report for details."
            )

        logger.info("Data Validation completed successfully")
        return report
