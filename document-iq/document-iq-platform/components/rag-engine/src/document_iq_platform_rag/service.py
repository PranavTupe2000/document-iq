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

text_splitter = get_text_splitter()
llm = get_llm_provider()


def _parse_int_field(data: dict, key: str, required: bool = False):
    value = data.get(key)
    if value is None:
        if required:
            raise ValueError(f"Missing required workflow field: {key}")
        return None
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(
            f"Invalid integer value for workflow field {key}: {value}"
        ) from exc


def process_event(event: dict):
    request_id = event["request_id"]

    workflow = redis_client.hgetall(f"workflow:{request_id}")
    try:
        org_id = _parse_int_field(workflow, "organization_id", required=True)
        group_id = _parse_int_field(workflow, "group_id")
        document_id = _parse_int_field(workflow, "document_id")
    except ValueError as exc:
        logger.error(f"Invalid workflow data for {request_id}: {exc}")
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

    classification = workflow.get("classification_result", "unknown")
    layout_data = workflow.get("layout_result")

    if not layout_data:
        logger.error("Layout result missing")
        return

    layout_json = ast.literal_eval(layout_data)

    # ==============================
    # 1️⃣ Build Hierarchical Context
    # ==============================
    context = build_hierarchical_context(layout_json)
    table_context = extract_table_insights(layout_json)

    if not context.strip():
        logger.error("No valid layout blocks found")
        return

    # ======================================================
    # 2️⃣ Add Structured Blocks to GLOBAL Knowledge Base
    # ======================================================
    documents = []

    for block in layout_json["blocks"]:
        if block["type"] not in ["header", "body", "table"]:
            continue

        chunks = text_splitter.split_text(block["text"])

        for chunk in chunks:
            documents.append(
                Document(
                    page_content=chunk,
                    metadata={
                        "request_id": request_id,
                        "organization_id": org_id,
                        "group_id": group_id,
                        "document_id": document_id,
                        "classification": classification,
                        "block_type": block["type"],
                        "page": block.get("page", 1),
                        "bbox": json.dumps(block.get("bbox")),
                        "position": block.get("position", 0),
                    },
                )
            )
    vectorstore = get_vectorstore(org_id)
    
    if documents:
        vectorstore.add_documents(documents)
        
        count = vectorstore._collection.count()
        logger.info(f"Chroma docs after insert: {count}")
        
    # TODO: Remove this
    # retriever = vectorstore.as_retriever(
    #     search_kwargs={
    #         "k": 5,
    #         "filter": {
                
    #         }
    #     }
    # )
        
    # ======================================================
    # Global Similarity Retrieval (Metadata Filtered)
    # ======================================================

    search_kwargs = {
        "query": f"{classification} document summary",
        "k": 5,
    }
    if group_id is not None:
        search_kwargs["filter"] = {"group_id": group_id}

    similar_docs = vectorstore.similarity_search(
            search_kwargs["query"],
            k=search_kwargs["k"],
            filter=search_kwargs.get("filter"),
        )

    global_context = "\n\n".join([doc.page_content for doc in similar_docs])


    # ==============================
    # 3️⃣ LLM Structured Generation
    # ==============================

    prompt = ChatPromptTemplate.from_template(
    """
You are an intelligent document analyst.

Document Classification: {classification}

Current Document Structure:
{context}

Table Information:
{table_context}

Similar Documents Knowledge:
{global_context}

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
        global_context=global_context,
        table_context=table_context,
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

    logger.info(f"Hierarchical RAG completed for {request_id}")


# ======================================================
# 🔹 Hierarchical PageIndex Context Builder
# ======================================================

def build_hierarchical_context(layout_json):
    """
    Builds structured context grouped by page and block type.
    Deterministic PageIndex RAG (No vector retrieval).
    """

    pages = {}

    for block in layout_json["blocks"]:
        page = block.get("page", 1)
        block_type = block["type"]

        if page not in pages:
            pages[page] = {
                "header": [],
                "body": [],
                "table": [],
                "footer": [],
                "metadata": [],
            }

        pages[page].setdefault(block_type, []).append(block)

    structured_context = []

    for page_num in sorted(pages.keys()):
        page_data = pages[page_num]

        structured_context.append(f"\n=== Page {page_num} ===\n")

        # Header first
        for block in page_data.get("header", []):
            structured_context.append(f"[HEADER]\n{block['text']}\n")

        # Body sorted by position
        for block in sorted(
            page_data.get("body", []),
            key=lambda x: x.get("position", 0),
        ):
            structured_context.append(f"[BODY]\n{block['text']}\n")

        # Tables
        for block in page_data.get("table", []):
            structured_context.append(f"[TABLE]\n{block['text']}\n")

    return "\n".join(structured_context)

def extract_table_insights(layout_json):
    """
    Extract structured insights from table blocks.
    """

    tables = []

    for block in layout_json["blocks"]:
        if block["type"] == "table":
            tables.append(block["text"])

    if not tables:
        return ""

    return "\n\n".join([f"[TABLE DATA]\n{t}" for t in tables])
