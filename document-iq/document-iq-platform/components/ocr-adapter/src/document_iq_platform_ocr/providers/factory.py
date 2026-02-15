from platform_shared.config.settings import Settings
from document_iq_platform_ocr.providers.mock import MockOCR
from document_iq_platform_ocr.providers.azure import AzureOCR
from document_iq_platform_ocr.providers.ocr_space import OCRSpaceOCR

settings = Settings()

PROVIDER_REGISTRY = {}

def register_provider(name: str, provider_cls):
    PROVIDER_REGISTRY[name] = provider_cls

# register
register_provider("mock", MockOCR)
register_provider("azure", AzureOCR)
register_provider("ocr_space", OCRSpaceOCR)


def get_ocr_provider():
    provider = settings.ocr_provider.lower()

    if provider not in PROVIDER_REGISTRY:
        raise ValueError(f"Unsupported OCR provider: {provider}")

    return PROVIDER_REGISTRY[provider]()

