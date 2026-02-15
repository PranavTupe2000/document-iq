import ast

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

    # Only use body + header blocks for RAG
    relevant_text = "\n\n".join(
        block["text"]
        for block in layout_json["blocks"]
        if block["type"] in ["header", "body"]
    )

    # 🔹 Chunk text
    chunks = text_splitter.split_text(relevant_text)

    documents = [
        Document(
            page_content=chunk,
            metadata={
                "request_id": request_id,
                "classification": classification,
            },
        )
        for chunk in chunks
    ]

    # 🔹 Add to vector store
    vectorstore.add_documents(documents)

    # 🔹 Retrieve relevant chunks
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
    retrieved_docs = retriever.invoke("Summarize this document")

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
        - key_insights must be a JSON array of plain strings (no markdown bullets).
        - confidence must be a number between 0 and 1.
        - Do not include any text outside the JSON object.
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

    logger.info(f"Production RAG completed for {request_id}")
