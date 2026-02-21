from .geometry import overlap_ratio


OVERLAP_THRESHOLD = 0.5


def merge_words_into_blocks(
    blocks: list,
    ocr_words: list,
) -> list:
    """
    Assign OCR words into layout blocks
    using overlap-based spatial merging.
    """

    for block in blocks:
        block_bbox = block["bbox"]
        assigned_words = []

        for word in ocr_words:
            ratio = overlap_ratio(word["bbox"], block_bbox)

            if ratio >= OVERLAP_THRESHOLD:
                assigned_words.append(word)

        # Sort words: top-to-bottom, then left-to-right
        assigned_words.sort(
            key=lambda w: (w["bbox"][1], w["bbox"][0])
        )

        block["text"] = " ".join(
            w["text"] for w in assigned_words
        )
        
    return blocks