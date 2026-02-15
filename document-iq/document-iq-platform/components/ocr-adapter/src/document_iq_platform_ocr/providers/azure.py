import os
import time
import requests

from document_iq_platform_ocr.providers.base import OCRProvider
from document_iq_platform_ocr.models.ocr_result import OCRResult, OCRPage


class AzureOCR(OCRProvider):

    def __init__(self):
        self.endpoint = os.getenv("AZURE_OCR_ENDPOINT")
        self.api_key = os.getenv("AZURE_OCR_KEY")

        if not self.endpoint or not self.api_key:
            raise ValueError("Azure OCR credentials not configured")

    def extract(self, file_path: str) -> OCRResult:

        with open(file_path, "rb") as f:
            data = f.read()

        headers = {
            "Ocp-Apim-Subscription-Key": self.api_key,
            "Content-Type": "application/octet-stream",
        }

        # 1️⃣ Submit document for analysis
        response = requests.post(
            f"{self.endpoint}/vision/v3.2/read/analyze",
            headers=headers,
            data=data,
            timeout=30,
        )

        if response.status_code != 202:
            raise RuntimeError(
                f"Azure OCR submit failed: {response.text}"
            )

        operation_url = response.headers.get("Operation-Location")

        if not operation_url:
            raise RuntimeError("Azure OCR missing Operation-Location header")

        # 2️⃣ Poll for result
        result = self._poll_operation(operation_url)

        # 3️⃣ Normalize into OCRResult
        pages = []

        read_results = (
            result.get("analyzeResult", {})
            .get("readResults", [])
        )

        for page in read_results:

            lines = [
                line.get("text", "")
                for line in page.get("lines", [])
            ]

            pages.append(
                OCRPage(
                    page=page.get("page", 1),
                    lines=lines,
                )
            )

        return OCRResult(pages=pages)

    def _poll_operation(self, operation_url: str) -> dict:

        headers = {
            "Ocp-Apim-Subscription-Key": self.api_key
        }

        for _ in range(20):  # max 20 attempts

            response = requests.get(
                operation_url,
                headers=headers,
                timeout=30,
            )

            if response.status_code != 200:
                raise RuntimeError(
                    f"Azure OCR polling failed: {response.text}"
                )

            result = response.json()
            status = result.get("status")

            if status == "succeeded":
                return result

            if status == "failed":
                raise RuntimeError("Azure OCR analysis failed")

            time.sleep(1)

        raise TimeoutError("Azure OCR polling timeout")
