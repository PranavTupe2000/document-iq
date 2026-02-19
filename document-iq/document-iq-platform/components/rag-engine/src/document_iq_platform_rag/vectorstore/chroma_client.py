import os

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from platform_shared.config.settings import Settings

settings = Settings()

EMBEDDING_MODEL = settings.huggingface_embedding_model
PERSIST_DIR = settings.chroma_persist_dir

os.makedirs(PERSIST_DIR, exist_ok=True)

def get_vectorstore(org_id: int):
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

    return Chroma(
        collection_name=f"org_{org_id}_kb",
        embedding_function=embeddings,
        persist_directory=PERSIST_DIR,
    )
