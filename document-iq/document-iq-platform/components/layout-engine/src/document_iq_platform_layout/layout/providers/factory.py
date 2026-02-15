from platform_shared.config.settings import Settings
from document_iq_platform_layout.layout.providers.simulated import SimulatedLayoutProvider
from document_iq_platform_layout.layout.providers.real import RealLayoutProvider


def get_layout_provider():
    settings = Settings()

    if settings.env == "dev":
        return SimulatedLayoutProvider()

    if settings.env == "prod":
        return RealLayoutProvider()

    raise ValueError("Invalid DOCUMENT_IQ_ENVIRONMENT value")
