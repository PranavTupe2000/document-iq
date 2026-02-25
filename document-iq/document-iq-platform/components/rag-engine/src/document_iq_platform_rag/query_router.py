from typing import Literal
from document_iq_platform_rag.llm_providers.factory import get_llm_provider

llm = get_llm_provider()

QueryIntent = Literal[
    "SINGLE_DOC",
    "CROSS_DOC_COMPARE",
    "GROUP_SUMMARY",
]

def classify_query_intent(question: str) -> QueryIntent:
    q = question.lower()

    # 🔥 Rule overrides first
    if "summarize all" in q or "summary of all" in q:
        return "GROUP_SUMMARY"

    if "compare all" in q or "compare" in q and "all" in q:
        return "CROSS_DOC_COMPARE"

    if "all invoices" in q or "all documents" in q:
        return "GROUP_SUMMARY"

    prompt = f"""
You are a query intent classifier for a document intelligence system.

Classify the following question into one of these categories:

1. SINGLE_DOC
   - Asking about a specific document or entity
   - Example: "What is the total amount in John Smith's invoice?"

2. CROSS_DOC_COMPARE
   - Comparing multiple documents
   - Example: "Compare all invoices in this group"
   - Example: "What are the differences between these contracts?"

3. GROUP_SUMMARY
   - Asking to summarize all documents in a group
   - Example: "Summarize all invoices in this group"

Return ONLY one of:
SINGLE_DOC
CROSS_DOC_COMPARE
GROUP_SUMMARY

# {question}
# """

    # Fallback to LLM
    try:
        response = llm.llm.invoke(prompt).content.strip()
        if response in ["SINGLE_DOC", "CROSS_DOC_COMPARE", "GROUP_SUMMARY"]:
            return response
    except Exception:
        pass

    return "SINGLE_DOC"