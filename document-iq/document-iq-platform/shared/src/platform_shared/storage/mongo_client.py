from pymongo import MongoClient
from platform_shared.config.settings import Settings

settings = Settings()

_client = None

def get_mongo_client():
    global _client
    if _client is None:
        _client = MongoClient(settings.mongo_uri)
    return _client

def get_mongo_db():
    client = get_mongo_client()
    return client[settings.mongo_db_name]