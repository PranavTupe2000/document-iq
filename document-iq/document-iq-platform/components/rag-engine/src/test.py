from document_iq_platform_rag.vectorstore.chroma_client import get_vectorstore


vectorstore = get_vectorstore(4)

print("Total docs:", vectorstore._collection.count())

sample = vectorstore._collection.peek(limit=3)
print("Sample metadata:", sample["metadatas"])
