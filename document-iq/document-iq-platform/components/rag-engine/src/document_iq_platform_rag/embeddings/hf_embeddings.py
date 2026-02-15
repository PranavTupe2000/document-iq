from langchain_huggingface import HuggingFaceEmbeddings
from platform_shared.config.settings import Settings

settings = Settings()

def get_embeddings():
    return HuggingFaceEmbeddings(
        model_name=settings.huggingface_embedding_model
    )
