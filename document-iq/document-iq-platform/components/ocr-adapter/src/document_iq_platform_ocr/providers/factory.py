from platform_shared.config.settings import Settings
from document_iq_platform_ocr.providers.mock import MockOCR
from document_iq_platform_ocr.providers.azure import AzureOCR

settings = Settings()


def get_ocr_provider():
    if settings.env.lower() == "dev":
        return MockOCR()
    return AzureOCR()
