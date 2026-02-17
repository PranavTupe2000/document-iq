import requests
from platform_shared.config.settings import Settings

settings = Settings()

query_url = settings.rag_engine_url + "/query"

def query_group(db, user, group_id: int, question: str):

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
