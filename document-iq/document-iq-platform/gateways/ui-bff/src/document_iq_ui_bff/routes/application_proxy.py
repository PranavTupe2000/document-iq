from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from document_iq_ui_bff.clients.application_client import ApplicationClient

router = APIRouter()
client = ApplicationClient()


@router.api_route("/groups/{path:path}", methods=["GET", "POST", "DELETE"])
async def proxy_groups(path: str, request: Request):
    body = await request.body()

    response = await client.forward(
        method=request.method,
        path=f"/groups/{path}",
        headers=dict(request.headers),
        json=await request.json() if body else None,
    )

    return JSONResponse(
        status_code=response.status_code,
        content=response.json(),
    )


@router.api_route("/documents/{path:path}", methods=["GET", "POST"])
async def proxy_documents(path: str, request: Request):
    body = await request.body()

    response = await client.forward(
        method=request.method,
        path=f"/documents/{path}",
        headers=dict(request.headers),
        json=await request.json() if body else None,
    )

    return JSONResponse(
        status_code=response.status_code,
        content=response.json(),
    )
