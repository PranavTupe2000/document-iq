from abc import ABC, abstractmethod
from typing import List, Dict


class LayoutProvider(ABC):

    @abstractmethod
    def extract_layout(
        self,
        file_path: str,
        ocr_result: dict
    ) -> Dict:
        pass