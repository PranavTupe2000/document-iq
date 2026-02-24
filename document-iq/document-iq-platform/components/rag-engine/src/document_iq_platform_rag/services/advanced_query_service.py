import hashlib
import json
import requests
from typing import List

from langchain_core.documents import Document
from sentence_transformers import CrossEncoder
from sklearn.metrics.pairwise import cosine_similarity

from document_iq_platform_rag.vectorstore.chroma_client import get_vectorstore
from document_iq_platform_rag.llm_providers.factory import get_llm_provider
from platform_shared.storage.redis_client import get_redis_client
from platform_shared.config.settings import Settings


settings = Settings()
llm = get_llm_provider()
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")


# =========================================================
# 🔹 Helper Functions (HTTP Calls to Application)
# =========================================================
def save_chat_message(session_id: str, role: str, content: str):
    try:
        requests.post(
            f"{settings.application_component_url}/internal/sessions/{session_id}/messages",
            json={"role": role, "content": content},
            timeout=5,
        )
    except Exception:
        pass  # Never break RAG if chat logging fails


def fetch_session_memory(session_id: str):
    try:
        response = requests.get(
            f"{settings.application_component_url}/internal/sessions/{session_id}/memory",
            timeout=5,
        )
        return response.json()
    except Exception:
        return {"summary_memory": "", "messages": []}


def update_session_summary(session_id: str, summary: str, last_index: int):
    try:
        requests.patch(
            f"{settings.application_component_url}/internal/sessions/{session_id}/summary",
            json={
                "summary_memory": summary,
                "last_summarized_index": last_index,
            },
            timeout=5,
        )
    except Exception:
        pass


def generate_title(session_id: str, question: str):
    try:
        raw_title = llm.llm.invoke(
            f"Generate a concise 4-6 word title for this conversation:\n{question}"
        ).content.strip().replace('"', '')

        if raw_title:
            requests.patch(
                f"{settings.application_component_url}/groups/0/sessions/{session_id}",
                json={"title": raw_title},
                timeout=5,
            )
    except Exception:
        pass


# =========================================================
# 🔹 Memory Builder (No Direct Mongo Access)
# =========================================================

MAX_MEMORY_MESSAGES = 20
MAX_CONTEXT_MESSAGES = 12


def build_conversation_context(session_id: str):

    memory_data = fetch_session_memory(session_id)

    summary_memory = memory_data.get("summary_memory", "")
    messages = memory_data.get("messages", [])

    if len(messages) > MAX_MEMORY_MESSAGES:

        messages_to_summarize = messages[:-MAX_CONTEXT_MESSAGES]

        conversation_text = ""
        for m in messages_to_summarize:
            conversation_text += f"{m['role']}: {m['content']}\n"

        summary_response = llm.llm.invoke(
            "Summarize this conversation preserving key facts:\n"
            + conversation_text
        ).content

        new_summary = summary_memory + "\n" + summary_response

        update_session_summary(
            session_id=session_id,
            summary=new_summary,
            last_index=len(messages),
        )

        messages = messages[-MAX_CONTEXT_MESSAGES:]

    conversation_context = ""

    if summary_memory:
        conversation_context += (
            f"Previous Conversation Summary:\n{summary_memory}\n\n"
        )

    for m in messages[-MAX_CONTEXT_MESSAGES:]:
        conversation_context += f"{m['role']}: {m['content']}\n"

    return conversation_context


# =========================================================
# 🔹 Main Advanced Query Function
# =========================================================

def advanced_query(org_id: int, group_id: int, session_id: str, question: str):

    redis_client = get_redis_client()

    cache_key = (
        f"rag_cache:{org_id}:{group_id}:{session_id}:"
        f"{hashlib.md5(question.encode()).hexdigest()}"
    )

    cached = redis_client.get(cache_key)

    save_chat_message(session_id, "user", question)

    if cached:
        save_chat_message(session_id, "assistant", cached)
        return {"answer": cached, "cached": True}

    vectorstore = get_vectorstore(int(org_id))

    # Auto title (first message)
    generate_title(session_id, question)

    # =====================================================
    # Multi Query Retrieval
    # =====================================================
    try:
        query_variants_raw = llm.generate(
            f"Generate 3 semantic variations as JSON list.\nQuery: {question}"
        )
        if isinstance(query_variants_raw, str):
            query_variants = json.loads(query_variants_raw)
        else:
            query_variants = [question]
    except Exception:
        query_variants = [question]

    all_docs: List[Document] = []

    for q in query_variants:
        retriever = vectorstore.as_retriever(
            search_kwargs={
                "k": 10,
                "filter": {"group_id": group_id}
                if group_id is not None
                else None,
            }
        )
        docs = retriever.invoke(q)
        all_docs.extend(docs)

    if not all_docs:
        fallback = "No relevant documents found."
        redis_client.set(cache_key, fallback, ex=300)
        save_chat_message(session_id, "assistant", fallback)
        return {"answer": fallback, "cached": False}

    unique_docs = {doc.page_content: doc for doc in all_docs}.values()
    candidate_docs = list(unique_docs)

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

    pairs = [(question, doc.page_content) for doc in filtered_docs]
    scores = reranker.predict(pairs)

    ranked = sorted(
        zip(filtered_docs, scores),
        key=lambda x: x[1],
        reverse=True,
    )

    top_docs = [doc for doc, _ in ranked[:5]]
    context = "\n\n".join([doc.page_content for doc in top_docs])

    # =====================================================
    # Inject Conversation Context
    # =====================================================
    conversation_context = build_conversation_context(session_id)

    response = llm.generate(
        f"""
You are a professional document analyst in an ongoing conversation.

Conversation Context:
{conversation_context}

Retrieved Document Context:
{context}

Current Question:
{question}

Return JSON:
{{
  "answer": "string"
}}
"""
    )

    if isinstance(response, dict):
        answer = response.get("answer") or json.dumps(response)
    else:
        answer = str(response)

    redis_client.set(cache_key, answer, ex=3600)
    save_chat_message(session_id, "assistant", answer)

    return {
        "answer": answer,
        "cached": False,
        "retrieved_chunks": len(top_docs),
    }