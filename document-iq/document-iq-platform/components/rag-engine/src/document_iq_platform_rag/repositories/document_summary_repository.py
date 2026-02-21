from datetime import datetime
from platform_shared.storage.mongo_client import get_mongo_db

def save_document_summary(
    document_id,
    org_id,
    group_id,
    classification,
    summary,
    key_insights,
    structured_entities=None,
):
    db = get_mongo_db()

    db.document_summaries.update_one(
        {"document_id": document_id},
        {
            "$set": {
                "org_id": org_id,
                "group_id": group_id,
                "classification": classification,
                "summary": summary,
                "key_insights": key_insights,
                "structured_entities": structured_entities or {},
                "updated_at": datetime.utcnow(),
            },
            "$setOnInsert": {
                "created_at": datetime.utcnow()
            }
        },
        upsert=True,
    )