from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

from platform_shared.config.settings import Settings

settings = Settings()

EMBEDDING_MODEL = settings.huggingface_embedding_model
CHROMA_HOST = settings.chroma_host
CHROMA_PORT = settings.chroma_port
CHROMA_PERSIST_DIR = settings.chroma_persist_dir


# Create embeddings once (important)
embeddings = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL
)


def get_vectorstore(org_id: int):
    kwargs = {
        "collection_name": f"org_{org_id}_kb",
        "embedding_function": embeddings,
    }

    if CHROMA_HOST:
        kwargs["host"] = CHROMA_HOST
        kwargs["port"] = int(CHROMA_PORT) if CHROMA_PORT else 8000
    elif CHROMA_PERSIST_DIR:
        kwargs["persist_directory"] = CHROMA_PERSIST_DIR

    return Chroma(**kwargs)
