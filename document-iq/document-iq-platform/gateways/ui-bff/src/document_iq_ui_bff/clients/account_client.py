import httpx
from platform_shared.config.settings import Settings

settings = Settings()


class AccountClient:
    def __init__(self):
        base_url = self._require_base_url(
            settings.account_component_url,
            "DOCUMENT_IQ_ACCOUNT_COMPONENT_URL",
        )
        self.client = httpx.AsyncClient(
            base_url=base_url,
            timeout=30.0,
        )

    @staticmethod
    def _require_base_url(value: str | None, env_name: str) -> str:
        if value is None or not value.strip():
            raise ValueError(
                f"Missing required configuration: {env_name}. "
                "Set it to the account component base URL (e.g. http://localhost:8001)."
            )
        return value.rstrip("/")

    async def forward(self, method: str, path: str, headers=None, data=None, json=None):
        response = await self.client.request(
            method=method,
            url=path,
            headers=headers,
            data=data,
            json=json,
        )
        return response
