from langchain_chroma import Chroma
from langchain_core.documents import Document

from platform_shared.config.settings import Settings
from document_iq_platform_rag.embeddings.hf_embeddings import get_embeddings

settings = Settings()

def get_vectorstore():
    embeddings = get_embeddings()

    return Chroma(
        collection_name="documentiq_rag",
        embedding_function=embeddings,
        persist_directory=settings.chroma_persist_dir,
    )
