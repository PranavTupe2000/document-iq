import requests
import time
import os
from dotenv import load_dotenv

from document_iq_platform_ocr.providers.base import OCRProvider

load_dotenv()


class AzureOCR(OCRProvider):
    def __init__(self):
        self.endpoint = os.getenv("AZURE_OCR_ENDPOINT")
        self.api_key = os.getenv("AZURE_OCR_KEY")

    def extract(self, file_path: str) -> dict:
        with open(file_path, "rb") as f:
            data = f.read()

        headers = {
            "Ocp-Apim-Subscription-Key": self.api_key,
            "Content-Type": "application/octet-stream",
        }

        response = requests.post(
            f"{self.endpoint}/vision/v3.2/read/analyze",
            headers=headers,
            data=data,
        )
        response.raise_for_status()

        operation_url = response.headers["Operation-Location"]

        # Poll for result
        while True:
            result_response = requests.get(
                operation_url,
                headers={"Ocp-Apim-Subscription-Key": self.api_key},
            )
            result = result_response.json()

            if result["status"] in ["succeeded", "failed"]:
                break

            time.sleep(1)

        if result["status"] == "failed":
            raise Exception("Azure OCR failed")

        return result
