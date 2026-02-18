import requests
from fastapi import HTTPException
from platform_shared.config.settings import Settings

settings = Settings()

query_url = settings.rag_engine_url + "/query"

def query_group(db, user, group_id: int, question: str):
    try:
        response = requests.post(
            query_url,
            json={
                "org_id": user["org_id"],
                "group_id": group_id,
                "question": question,
            },
            timeout=20,
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout as exc:
        raise HTTPException(
            status_code=504,
            detail="RAG service timed out while processing the query",
        ) from exc
    except requests.exceptions.HTTPError as exc:
        detail = "RAG service returned an error"
        try:
            payload = response.json()
            detail = payload.get("detail") or payload.get("message") or detail
        except Exception:
            if response.text:
                detail = response.text
        raise HTTPException(status_code=502, detail=detail) from exc
    except requests.exceptions.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail="Unable to reach RAG service",
        ) from exc
