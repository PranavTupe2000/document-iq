import ast
import json

from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate

from platform_shared.config.settings import Settings
from platform_shared.storage.redis_client import get_redis_client
from platform_shared.messaging.kafka import create_producer
from document_iq_core.utils import get_logger

from document_iq_platform_rag.vectorstore.chroma_client import get_vectorstore
from document_iq_platform_rag.chunking.text_splitter import get_text_splitter
from document_iq_platform_rag.llm_providers.factory import get_llm_provider

logger = get_logger("RAGService")

settings = Settings()
redis_client = get_redis_client()
producer = create_producer(bootstrap_servers=settings.kafka_bootstrap_servers)
vectorstore = get_vectorstore()
text_splitter = get_text_splitter()
llm = get_llm_provider()


def process_event(event: dict):
    request_id = event["request_id"]

    workflow = redis_client.hgetall(f"workflow:{request_id}")
    classification = workflow.get("classification_result", "unknown")
    layout_data = workflow.get("layout_result")

    if not layout_data:
        logger.error("Layout result missing")
        return

    layout_json = ast.literal_eval(layout_data)

    documents = []

    # 🔹 Process block-by-block instead of merged text
    for block in layout_json["blocks"]:

        # Ignore footer + metadata blocks
        if block["type"] not in ["header", "body"]:
            continue

        chunks = text_splitter.split_text(block["text"])

        for chunk in chunks:
            documents.append(
                Document(
                    page_content=chunk,
                    metadata={
                        "request_id": request_id,
                        "classification": classification,
                        "block_type": block["type"],
                        "page": block.get("page", 1),
                        "bbox": json.dumps(block.get("bbox")),
                        "position": block.get("position", 0),
                    },
                )
            )

    if not documents:
        logger.error("No valid layout blocks found")
        return

    # 🔹 Add to vector store
    vectorstore.add_documents(documents)

    # 🔹 Metadata-aware retriever
    retriever = vectorstore.as_retriever(
        search_kwargs={
            "k": 4,
            "filter": {
                "request_id": request_id,
                "block_type": {"$in": ["header", "body"]},
            },
        }
    )

    # 🔹 Dynamic query based on classification
    query = f"Summarize this {classification} document and extract key insights."

    retrieved_docs = retriever.invoke(query)

    context = "\n\n".join([d.page_content for d in retrieved_docs])

    # 🔹 Prompt Template
    prompt = ChatPromptTemplate.from_template(
        """
        You are an intelligent document analyst.

        Document Classification: {classification}

        Context:
        {context}

        Return ONLY a valid JSON object with this exact schema:
        {{
          "summary": "string",
          "key_insights": ["string", "string"],
          "document_type": "string",
          "confidence": 0.0
        }}

        Rules:
        - key_insights must be a JSON array of plain strings.
        - confidence must be between 0 and 1.
        - No extra text outside JSON.
        """
    )

    final_prompt = prompt.format(
        classification=classification,
        context=context,
    )

    try:
        structured_response = llm.generate(final_prompt)
    except Exception as exc:
        logger.exception(f"RAG failed for {request_id}: {exc}")
        redis_client.hset(
            f"workflow:{request_id}",
            mapping={
                "rag_status": "failed",
                "current_stage": "rag_failed",
                "overall_status": "failed",
                "error": str(exc),
            },
        )
        return

    redis_client.hset(
        f"workflow:{request_id}",
        mapping={
            "rag_status": "completed",
            "rag_response": str(structured_response),
            "current_stage": "completed",
            "overall_status": "completed",
        },
    )

    producer.send(
        "document.rag.completed",
        {"request_id": request_id},
    )
    producer.flush()

    logger.info(f"Enhanced RAG completed for {request_id}")
