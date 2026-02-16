from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from platform_shared.config.settings import Settings

settings = Settings()

EMBEDDING_MODEL = settings.huggingface_embedding_model
PERSIST_DIR = settings.chroma_persist_dir


def get_vectorstore(collection_name: str):
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

    return Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=PERSIST_DIR,
    )
