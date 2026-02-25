from platform_shared.storage.mongo_client import get_mongo_db

db = get_mongo_db()

db.document_layouts.create_index("document_id", unique=True)
db.document_layouts.create_index("group_id")
db.document_layouts.create_index("org_id")

db.document_summaries.create_index("document_id", unique=True)
db.document_summaries.create_index("group_id")
db.document_summaries.create_index("org_id")
db.document_summaries.create_index("classification")

db.chat_sessions.create_index("session_id", unique=True)
db.chat_sessions.create_index("group_id")
db.chat_sessions.create_index("org_id")

db.chat_messages.create_index("session_id")
db.chat_messages.create_index("created_at")

print("Indexes created successfully")