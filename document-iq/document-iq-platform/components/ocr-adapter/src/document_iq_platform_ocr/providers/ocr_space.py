import requests

from document_iq_platform_ocr.providers.base import OCRProvider
from document_iq_platform_ocr.models.ocr_result import (
    OCRResult,
    OCRPage,
    OCRWord,
)
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

        for page_index, page in enumerate(parsed_results):

            text_overlay = page.get("TextOverlay")

            if not text_overlay:
                continue

            page_number = page_index + 1
            lines_text = []

            for line in text_overlay.get("Lines", []):
                line_words = line.get("Words", [])

                line_text = " ".join(
                    w.get("WordText", "")
                    for w in line_words
                )
                lines_text.append(line_text)

                for w in line_words:

                    text = w.get("WordText", "")

                    left = w.get("Left", 0)
                    top = w.get("Top", 0)
                    width = w.get("Width", 0)
                    height = w.get("Height", 0)

                    x0 = left
                    y0 = top
                    x1 = left + width
                    y1 = top + height

                    words.append(
                        OCRWord(
                            text=text,
                            bbox=[x0, y0, x1, y1],
                            page=page_number,
                        )
                    )

            pages.append(
                OCRPage(
                    page=page_number,
                    lines=lines_text,
                )
            )

        return OCRResult(pages=pages, words=words)