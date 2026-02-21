import requests

from document_iq_platform_ocr.providers.base import OCRProvider
from document_iq_platform_ocr.models.ocr_result import OCRResult, OCRPage, OCRWord
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
        words = []

        parsed_results = data.get("ParsedResults", [])

        for idx, page in enumerate(parsed_results):

            page_number = idx + 1
            text = page.get("ParsedText", "")

            lines = [
                line.strip()
                for line in text.splitlines()
                if line.strip()
            ]

            # Synthetic layout: stack lines vertically
            y_cursor = 0
            line_height = 40

            for line in lines:

                words.append(
                    OCRWord(
                        text=line,
                        bbox=[0, y_cursor, 1000, y_cursor + line_height],
                        page=page_number,
                    )
                )

                y_cursor += line_height + 10

            pages.append(
                OCRPage(
                    page=page_number,
                    lines=lines,
                )
            )

        return OCRResult(pages=pages, words=words)
