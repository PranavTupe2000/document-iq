from document_iq_platform_ocr.providers.base import OCRProvider


class MockOCR(OCRProvider):
    def extract(self, file_path: str) -> dict:
        return {
            "analyzeResult": {
                "readResults": [
                    {
                        "lines": [
                            {"text": "Invoice Number: 12345"},
                            {"text": "Total Amount: $450"},
                            {"text": "Vendor: ABC Corp"},
                        ]
                    }
                ]
            }
        }
