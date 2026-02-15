import requests

from document_iq_platform_ocr.providers.base import OCRProvider
from document_iq_platform_ocr.models.ocr_result import OCRResult, OCRPage
from platform_shared.config.settings import Settings


class OCRSpaceOCR(OCRProvider):

    ENDPOINT = "https://api.ocr.space/parse/image"

    def __init__(self):

        settings = Settings()
        self.api_key = settings.ocr_space_api_key

    def extract(self, file_path: str) -> OCRResult:

        with open(file_path, "rb") as f:
            response = requests.post(
                self.ENDPOINT,
                files={"file": f},
                data={
                    "apikey": self.api_key,
                    "language": "eng",
                    "isOverlayRequired": True,
                },
                timeout=60,
            )

        data = response.json()

        if data.get("IsErroredOnProcessing"):
            raise RuntimeError(
                f"OCR.space error: {data.get('ErrorMessage')}"
            )

        pages = []

        parsed_results = data.get("ParsedResults", [])

        for idx, page in enumerate(parsed_results):

            text = page.get("ParsedText", "")

            lines = [
                line.strip()
                for line in text.splitlines()
                if line.strip()
            ]

            pages.append(
                OCRPage(
                    page=idx + 1,
                    lines=lines,
                )
            )

        return OCRResult(pages=pages)
