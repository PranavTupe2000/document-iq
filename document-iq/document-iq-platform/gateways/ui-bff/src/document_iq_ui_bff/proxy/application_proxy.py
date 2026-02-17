from fastapi import APIRouter, Request, Response
from document_iq_ui_bff.proxy.http_client import ServiceClient
from platform_shared.config.settings import Settings

settings = Settings()

router = APIRouter()
client = ServiceClient(settings.application_component_url)


@router.api_route("/groups/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
@router.api_route("/documents/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_application(path: str, request: Request):

    body = await request.body()

    response = await client.forward(
        method=request.method,
        path=f"/{request.url.path.lstrip('/')}",
        headers=dict(request.headers),
        body=body,
        params=dict(request.query_params),
    )

    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=dict(response.headers),
        media_type=response.headers.get("content-type"),
    )
