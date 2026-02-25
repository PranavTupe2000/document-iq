import ast
import json

from document_iq_platform_rag.chunking.block_chunker import build_block_documents
from document_iq_platform_rag.repositories.document_summary_repository import save_document_summary
from document_iq_platform_rag.repositories.layout_repository import save_layout_ast

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

    # Save layout AST
    save_layout_ast(
        document_id=document_id,
        org_id=org_id,
        group_id=group_id,
        layout_ast=layout_json
    )

    # ======================================================
    # 1️⃣ Build Context
    # ======================================================
    context = build_hierarchical_context(layout_json)
    table_context = extract_table_insights(layout_json)

    if not context.strip():
        logger.error("No valid layout blocks found")
        return

    # ======================================================
    # 2️⃣ Add Blocks to Vector Store
    # ======================================================
    documents = build_block_documents(
        layout_json=layout_json,
        org_id=org_id,
        group_id=group_id,
        document_id=document_id,
        classification=classification,
        text_splitter=text_splitter,
    )

    vectorstore = get_vectorstore(org_id)

    if documents:
        vectorstore.add_documents(documents)
        logger.info(f"Chroma docs after insert: {vectorstore._collection.count()}")

    # ======================================================
    # 3️⃣ SINGLE LLM CALL (Summary + Entities)
    # ======================================================

    full_prompt = f"""
You are an advanced document intelligence system.

Document Classification: {classification}

Document Content:
{context}

Table Information:
{table_context}

Generate:
1) A concise but informative summary
2) 3-5 key insights
3) Extract structured entities relevant to the document type
4) A realistic confidence between 0.0 and 0.95

Return ONLY valid JSON in this schema:

{{
  "summary": "string",
  "key_insights": ["string"],
  "document_type": "string",
  "confidence": 0.0,
  "structured_entities": {{
    "entities": [
      {{
        "type": "entity_type",
        "label": "human_readable_label",
        "value": "exact_text_from_document",
        "page": 1,
        "confidence": 0.0
      }}
    ]
  }}
}}

Rules:
- Extract ONLY values present exactly in document
- NEVER hallucinate
- Confidence must NOT be 1.0
- If no entities found, return empty list
- Output valid JSON only
"""

    try:
        structured_response = llm.generate(full_prompt)

        if not isinstance(structured_response, dict):
            raise ValueError("Invalid structured response from LLM")

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

    # ======================================================
    # 4️⃣ Extract & Clamp Data
    # ======================================================

    summary = structured_response.get("summary")
    key_insights = structured_response.get("key_insights", [])
    document_type = structured_response.get("document_type", classification)

    confidence = structured_response.get("confidence", 0.7)
    try:
        confidence = float(confidence)
    except Exception:
        confidence = 0.7

    confidence = max(0.0, min(confidence, 0.95))

    structured_entities = structured_response.get("structured_entities", {})
    entities = structured_entities.get("entities", [])

    # Clamp entity confidence
    for e in entities:
        try:
            e["confidence"] = max(
                0.0,
                min(float(e.get("confidence", 0.7)), 0.95)
            )
        except Exception:
            e["confidence"] = 0.7

    final_result = {
        "summary": summary,
        "key_insights": key_insights,
        "document_type": document_type,
        "confidence": confidence,
        "structured_entities": {
            "entities": entities
        },
    }

    # ======================================================
    # 5️⃣ Save to Mongo
    # ======================================================

    save_document_summary(
        document_id=document_id,
        org_id=org_id,
        group_id=group_id,
        classification=classification,
        summary=summary,
        key_insights=key_insights,
        structured_entities={"entities": entities},
    )

    # ======================================================
    # 6️⃣ Update Workflow
    # ======================================================

    redis_client.hset(
        f"workflow:{request_id}",
        mapping={
            "rag_status": "completed",
            "rag_response": json.dumps(final_result),
            "current_stage": "completed",
            "overall_status": "completed",
        },
    )

    producer.send(
        "document.rag.completed",
        {"request_id": request_id},
    )
    producer.flush()

    logger.info(f"Hybrid RAG completed for {request_id}")


# ======================================================
# Context Builders
# ======================================================

def build_hierarchical_context(layout_json):

    blocks = layout_json.get("blocks", [])
    qa_pairs = layout_json.get("qa_pairs", [])

    structured_context = []
    pages = {}

    qa_bboxes = set()

    for pair in qa_pairs:
        qb = tuple(pair.get("question_bbox", []))
        ab = tuple(pair.get("answer_bbox", []))
        if qb:
            qa_bboxes.add(qb)
        if ab:
            qa_bboxes.add(ab)

    for block in blocks:
        page = block.get("page", 1)
        pages.setdefault(page, []).append(block)

    for page_num in sorted(pages.keys()):
        structured_context.append(f"\n=== Page {page_num} ===\n")

        page_blocks = pages[page_num]

        for block in sorted(page_blocks, key=lambda x: x.get("position", 0)):

            bbox_tuple = tuple(block.get("bbox", []))
            if bbox_tuple in qa_bboxes:
                continue

            text = block.get("text", "").strip()
            if not text:
                continue

            block_type = block.get("type", "other")

            if block_type == "header":
                structured_context.append(f"[HEADER] {text}")
            elif block_type == "table":
                structured_context.append(f"[TABLE] {text}")
            else:
                structured_context.append(text)

    return "\n".join(structured_context)


def extract_table_insights(layout_json):

    tables = []

    for block in layout_json.get("blocks", []):
        if block.get("type") == "table":
            tables.append(block.get("text"))

    if not tables:
        return ""

    return "\n\n".join([f"[TABLE DATA]\n{t}" for t in tables])