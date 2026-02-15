from document_iq_platform_ocr.providers.base import OCRProvider
from document_iq_platform_ocr.models.ocr_result import OCRResult, OCRPage


class MockOCR(OCRProvider):

    def extract(self, file_path: str) -> OCRResult:

        return OCRResult(
            pages=[
                OCRPage(
                    page=1,
                    lines=[
                        "This is a mock OCR result.",
                        "Used for development and testing.",
                        f"Source file: {file_path}",
                    ],
                )
            ]
        )
