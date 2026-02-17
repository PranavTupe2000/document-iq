import httpx
from platform_shared.config.settings import Settings

settings = Settings()


class ApplicationClient:
    def __init__(self):
        base_url = self._require_base_url(
            settings.application_component_url,
            "DOCUMENT_IQ_APPLICATION_COMPONENT_URL",
        )
        self.client = httpx.AsyncClient(
            base_url=base_url,
            timeout=60.0,
        )

    @staticmethod
    def _require_base_url(value: str | None, env_name: str) -> str:
        if value is None or not value.strip():
            raise ValueError(
                f"Missing required configuration: {env_name}. "
                "Set it to the application component base URL (e.g. http://localhost:8002)."
            )
        return value.rstrip("/")

    async def forward(self, method: str, path: str, headers=None, json=None):
        response = await self.client.request(
            method=method,
            url=path,
            headers=headers,
            json=json,
        )
        return response
