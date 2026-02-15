from abc import ABC, abstractmethod
from document_iq_platform_ocr.models.ocr_result import OCRResult


class OCRProvider(ABC):

    @abstractmethod
    def extract(self, file_path: str) -> OCRResult:
        """
        Extract text and return normalized OCR result.
        """
        pass
