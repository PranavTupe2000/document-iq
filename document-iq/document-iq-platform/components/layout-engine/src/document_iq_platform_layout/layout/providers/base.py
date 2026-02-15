from abc import ABC, abstractmethod
from typing import List, Dict


class LayoutProvider(ABC):

    @abstractmethod
    def extract_layout(self, ocr_text: str) -> Dict:
        pass
