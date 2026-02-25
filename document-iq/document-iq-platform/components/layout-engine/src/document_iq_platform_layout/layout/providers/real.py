from document_iq_platform_layout.layout.post_processing.qa_pairing import pair_questions_answers
from document_iq_platform_layout.layout.post_processing.table_extractor import extract_tables
from document_iq_platform_layout.layout.providers.base import LayoutProvider
from document_iq_platform_layout.layout.merging.spatial_merger import (
    merge_words_into_blocks,
)
from document_iq_platform_layout.model_loader import load_model


class RealLayoutProvider(LayoutProvider):

    def __init__(self):
        self.model = load_model()

    def extract_layout(self, file_path: str, ocr_result: dict):

        # 1️⃣ Run YOLO
        results = self.model.predict(file_path)

        blocks = []

        # Ultralytics returns list of Results
        for result in results:

            boxes = result.boxes

            if boxes is None:
                continue

            for idx in range(len(boxes)):

                # Extract bounding box
                xyxy = boxes.xyxy[idx].tolist()
                x0, y0, x1, y1 = map(int, xyxy)

                # Class index → label
                class_id = int(boxes.cls[idx].item())
                label = result.names[class_id]

                confidence = float(boxes.conf[idx].item())

                blocks.append({
                    "type": label,
                    "bbox": [x0, y0, x1, y1],
                    "text": "",
                    "page": 1,
                    "position": len(blocks),
                    "confidence": confidence,
                })

        # 2️⃣ Merge OCR words
        from document_iq_platform_layout.layout.merging.spatial_merger import (
            merge_words_into_blocks,
        )

        blocks = merge_words_into_blocks(
            blocks,
            ocr_result.get("words", [])
        )
        
        tables, remaining_blocks = extract_tables(blocks)

        qa_pairs = pair_questions_answers(remaining_blocks)

        blocks = remaining_blocks + tables

        return {
            "blocks": blocks,
            "qa_pairs": qa_pairs,
            "page_width": 1000,
        }