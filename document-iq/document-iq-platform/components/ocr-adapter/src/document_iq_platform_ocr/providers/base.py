from abc import ABC, abstractmethod


class OCRProvider(ABC):
    @abstractmethod
    def extract(self, file_path: str) -> dict:
        """
        Extract OCR result from file and return
        Azure-compatible response format.
        """
        pass
