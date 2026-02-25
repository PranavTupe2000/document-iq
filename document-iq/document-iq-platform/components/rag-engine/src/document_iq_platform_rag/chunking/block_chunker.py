from langchain_core.documents import Document

MAX_BLOCK_LENGTH = 1200  # safe threshold


def build_block_documents(
    layout_json,
    org_id,
    group_id,
    document_id,
    classification,
    text_splitter,
):
    documents = []

    for block in layout_json["blocks"]:

        if not block.get("text") or not block["text"].strip():
            continue

        block_type = block.get("type")

        # Only index meaningful blocks
        if block_type not in ["header", "body", "table"]:
            continue

        block_text = block["text"]

        # If small enough → index as single chunk
        if len(block_text) <= MAX_BLOCK_LENGTH:
            documents.append(
                Document(
                    page_content=block_text,
                    metadata={
                        "org_id": org_id,
                        "group_id": group_id,
                        "document_id": document_id,
                        "classification": classification,
                        "block_type": block_type,
                        "page": block.get("page", 1),
                        "position": block.get("position", 0),
                        "bbox": block.get("bbox"),
                    },
                )
            )
        else:
            # Split large block
            chunks = text_splitter.split_text(block_text)

            for chunk in chunks:
                documents.append(
                    Document(
                        page_content=chunk,
                        metadata={
                            "org_id": org_id,
                            "group_id": group_id,
                            "document_id": document_id,
                            "classification": classification,
                            "block_type": block_type,
                            "page": block.get("page", 1),
                            "position": block.get("position", 0),
                            "bbox": block.get("bbox"),
                        },
                    )
                )

    return documents