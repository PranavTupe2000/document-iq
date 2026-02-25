from datetime import datetime
from platform_shared.storage.mongo_client import get_mongo_db

def save_layout_ast(document_id, org_id, group_id, layout_ast):
    db = get_mongo_db()

    db.document_layouts.update_one(
        {"document_id": document_id},
        {
            "$set": {
                "org_id": org_id,
                "group_id": group_id,
                "layout_ast": layout_ast,
                "updated_at": datetime.utcnow(),
            },
            "$setOnInsert": {
                "created_at": datetime.utcnow()
            }
        },
        upsert=True,
    )

def get_layout_ast(document_id):
    db = get_mongo_db()
    return db.document_layouts.find_one({"document_id": document_id})