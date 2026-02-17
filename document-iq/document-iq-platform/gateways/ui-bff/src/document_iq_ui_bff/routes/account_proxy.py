from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from document_iq_ui_bff.clients.account_client import AccountClient

router = APIRouter()
client = AccountClient()


@router.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_auth(path: str, request: Request):
    body = await request.body()

    response = await client.forward(
        method=request.method,
        path=f"/auth/{path}",
        headers=dict(request.headers),
        data=body,
    )

    return JSONResponse(
        status_code=response.status_code,
        content=response.json(),
    )


@router.api_route("/users/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_users(path: str, request: Request):
    response = await client.forward(
        method=request.method,
        path=f"/users/{path}",
        headers=dict(request.headers),
    )

    return JSONResponse(
        status_code=response.status_code,
        content=response.json(),
    )


@router.api_route("/organizations/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_orgs(path: str, request: Request):
    response = await client.forward(
        method=request.method,
        path=f"/organizations/{path}",
        headers=dict(request.headers),
    )

    return JSONResponse(
        status_code=response.status_code,
        content=response.json(),
    )
