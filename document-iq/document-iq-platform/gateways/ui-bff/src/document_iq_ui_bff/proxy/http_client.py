import httpx
from platform_shared.config.settings import Settings

settings = Settings()


class ServiceClient:

    def __init__(self, base_url: str):
        self.client = httpx.AsyncClient(
            base_url=base_url,
            timeout=60.0,
        )

    async def forward(
        self,
        method: str,
        path: str,
        headers: dict,
        body: bytes | None = None,
        params: dict | None = None,
    ):
        return await self.client.request(
            method=method,
            url=path,
            headers=headers,
            content=body,
            params=params,
        )
