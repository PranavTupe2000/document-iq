from datetime import datetime
import uuid
from platform_shared.storage.mongo_client import get_mongo_db


def create_session(org_id, group_id, title):
    db = get_mongo_db()

    session_id = str(uuid.uuid4())

    session = {
        "session_id": session_id,
        "org_id": org_id,
        "group_id": group_id,
        "title": title,
        "summary_memory": "",
        "last_summarized_index": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    db.chat_sessions.insert_one(session)

    # Return fresh copy without _id
    return db.chat_sessions.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )


def get_session(session_id):
    db = get_mongo_db()
    session = db.chat_sessions.find_one({"session_id": session_id}, {"_id": 0})
    return session


def list_sessions(org_id, group_id):
    db = get_mongo_db()
    return list(
        db.chat_sessions.find(
            {"org_id": org_id, "group_id": group_id},
            {"_id": 0}
        ).sort("created_at", -1)
    )


def rename_session(session_id, new_title):
    db = get_mongo_db()

    db.chat_sessions.update_one(
        {"session_id": session_id},
        {"$set": {"title": new_title, "updated_at": datetime.utcnow()}}
    )


def save_message(session_id, role, content):
    db = get_mongo_db()

    db.chat_messages.insert_one({
        "session_id": session_id,
        "role": role,
        "content": content,
        "created_at": datetime.utcnow()
    })


def get_recent_messages(session_id, limit=15):
    db = get_mongo_db()

    return list(
        db.chat_messages.find(
            {"session_id": session_id},
            {"_id": 0}
        ).sort("created_at", 1)
    )
    
def update_session_summary(session_id, summary, last_index):
    db = get_mongo_db()

    db.chat_sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "summary_memory": summary,
                "last_summarized_index": last_index,
                "updated_at": datetime.utcnow()
            }
        }
    )