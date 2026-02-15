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

    ocr_text = workflow.get("ocr_text")
    classification = workflow.get("classification_result", "unknown")

    if not ocr_text:
        logger.error("No OCR text found")
        return

    # 🔹 Chunk text
    chunks = text_splitter.split_text(ocr_text)

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

        Provide structured output:
        - summary
        - key insights (bullet points)
        - document_type
        - confidence (0 to 1)
        """
    )

    final_prompt = prompt.format(
        classification=classification,
        context=context,
    )

    # 🔹 LLM call
    structured_response = llm.generate(final_prompt)

    # 🔹 Save to Redis
    redis_client.hset(
        f"workflow:{request_id}",
        mapping={
            "rag_status": "completed",
            "rag_response": str(structured_response),
        },
    )

    producer.send(
        "document.rag.completed",
        {"request_id": request_id},
    )
    producer.flush()

    logger.info(f"Production RAG completed for {request_id}")
