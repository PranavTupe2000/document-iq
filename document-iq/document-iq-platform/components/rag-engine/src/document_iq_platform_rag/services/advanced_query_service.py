import hashlib
from typing import List

from langchain_core.documents import Document

from document_iq_platform_rag.vectorstore.chroma_client import get_vectorstore
from document_iq_platform_rag.llm_providers.factory import get_llm_provider
from platform_shared.storage.redis_client import get_redis_client

from sentence_transformers import CrossEncoder
from sklearn.metrics.pairwise import cosine_similarity


# Initialize heavy models once
llm = get_llm_provider()
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")


def advanced_query(org_id: int, group_id: int, question: str):

    redis_client = get_redis_client()

    # =====================================================
    # 0️⃣ Semantic Caching
    # =====================================================
    cache_key = f"rag_cache:{org_id}:{group_id}:{hashlib.md5(question.encode()).hexdigest()}"
    cached = redis_client.get(cache_key)

    if cached:
        return {"answer": cached, "cached": True}

    vectorstore = get_vectorstore(org_id)

    # =====================================================
    # 1️⃣ Multi-Query Retrieval
    # =====================================================
    # Generate query variations
    multi_query_prompt = f"""
    Generate 3 semantic variations of this query.
    Return JSON list.

    Query: {question}
    """

    try:
        import json
        query_variants = json.loads(llm.generate(multi_query_prompt))
    except Exception:
        query_variants = [question]

    all_docs: List[Document] = []

    for q in query_variants:
        search_kwargs = {"k": 6}
        if group_id is not None:
            search_kwargs["filter"] = {"group_id": group_id}

        retriever = vectorstore.as_retriever(search_kwargs=search_kwargs)
        docs = retriever.invoke(q)
        all_docs.extend(docs)

    # =====================================================
    # 2️⃣ Vector Compression / Deduplication
    # =====================================================
    # Remove exact duplicates first
    unique_docs = {doc.page_content: doc for doc in all_docs}.values()
    candidate_docs = list(unique_docs)

    # Optional semantic deduplication
    embeddings = vectorstore._embedding_function.embed_documents(
        [doc.page_content for doc in candidate_docs]
    )

    filtered_docs = []
    used_indices = set()

    for i, emb1 in enumerate(embeddings):
        if i in used_indices:
            continue

        filtered_docs.append(candidate_docs[i])

        for j, emb2 in enumerate(embeddings):
            if i == j:
                continue

            similarity = cosine_similarity([emb1], [emb2])[0][0]

            if similarity > 0.95:
                used_indices.add(j)

    candidate_docs = filtered_docs

    # =====================================================
    # 3️⃣ Cross-Encoder Reranking
    # =====================================================
    pairs = [(question, doc.page_content) for doc in candidate_docs]
    scores = reranker.predict(pairs)

    ranked = sorted(
        zip(candidate_docs, scores),
        key=lambda x: x[1],
        reverse=True
    )

    top_docs = [doc for doc, _ in ranked[:5]]

    context = "\n\n".join([doc.page_content for doc in top_docs])

    # =====================================================
    # 4️⃣ LLM Final Answer
    # =====================================================
    response = llm.generate(
        f"""
        You are a professional document analyst.

        Context:
        {context}

        Question:
        {question}

        Provide concise and accurate answer.
        """
    )

    # =====================================================
    # 5️⃣ Store in Semantic Cache
    # =====================================================
    redis_client.set(cache_key, response, ex=3600)

    return {
        "answer": response,
        "cached": False,
        "retrieved_chunks": len(top_docs)
    }
