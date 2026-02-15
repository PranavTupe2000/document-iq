import re
from typing import Dict

from document_iq_platform_layout.layout.providers.base import LayoutProvider

PAGE_WIDTH = 1000
LEFT_MARGIN = 50
RIGHT_MARGIN = 950
BLOCK_HEIGHT = 80
VERTICAL_GAP = 20


class SimulatedLayoutProvider(LayoutProvider):

    def split_into_blocks(self, text: str):
        raw_blocks = re.split(r"\n\s*\n", text.strip())
        blocks = []

        for i, block in enumerate(raw_blocks):
            block = block.strip()
            if not block:
                continue

            blocks.append({
                "text": block,
                "position": i
            })

        return blocks

    def classify_block(self, block_text: str):
        text = block_text.lower()

        if "invoice" in text or "receipt" in text:
            return "header"

        if "signature" in text:
            return "footer"

        if len(block_text) < 40:
            return "metadata"

        return "body"

    def simulate_bounding_box(self, position: int, text: str):
        top = 50 + position * (BLOCK_HEIGHT + VERTICAL_GAP)
        bottom = top + BLOCK_HEIGHT

        text_length_factor = min(len(text) / 100, 1.0)
        width = int((RIGHT_MARGIN - LEFT_MARGIN) * (0.5 + 0.5 * text_length_factor))

        left = LEFT_MARGIN
        right = LEFT_MARGIN + width

        return [left, top, right, bottom]

    def extract_layout(self, ocr_text: str) -> Dict:
        blocks = self.split_into_blocks(ocr_text)

        structured_blocks = []

        for block in blocks:
            block_type = self.classify_block(block["text"])
            bbox = self.simulate_bounding_box(block["position"], block["text"])

            structured_blocks.append({
                "type": block_type,
                "text": block["text"],
                "bbox": bbox,
                "page": 1,
                "position": block["position"]
            })

        return {
            "blocks": structured_blocks,
            "page_width": PAGE_WIDTH
        }
