from collections import defaultdict
import statistics

ROW_Y_THRESHOLD = 25
COLUMN_X_THRESHOLD = 40
MIN_COLUMNS = 3
MIN_ROWS = 2


def bbox_center(bbox):
    x0, y0, x1, y1 = bbox
    return ((x0 + x1) / 2, (y0 + y1) / 2)


def merge_bbox(blocks):
    x0 = min(b["bbox"][0] for b in blocks)
    y0 = min(b["bbox"][1] for b in blocks)
    x1 = max(b["bbox"][2] for b in blocks)
    y1 = max(b["bbox"][3] for b in blocks)
    return [x0, y0, x1, y1]


# ---------------------------------------------------
# STEP 1 — Row Clustering (Y proximity)
# ---------------------------------------------------
def cluster_rows(blocks):
    rows = []

    for block in blocks:
        _, y_center = bbox_center(block["bbox"])

        placed = False
        for row in rows:
            if abs(row["y_center"] - y_center) < ROW_Y_THRESHOLD:
                row["blocks"].append(block)
                placed = True
                break

        if not placed:
            rows.append({
                "y_center": y_center,
                "blocks": [block]
            })

    # Sort rows top to bottom
    rows.sort(key=lambda r: r["y_center"])
    return rows


# ---------------------------------------------------
# STEP 2 — Column Detection (X clustering)
# ---------------------------------------------------
def detect_columns(rows):

    x_centers = []

    for row in rows:
        for block in row["blocks"]:
            x_center, _ = bbox_center(block["bbox"])
            x_centers.append(x_center)

    x_centers.sort()

    columns = []

    for x in x_centers:
        placed = False
        for col in columns:
            if abs(col - x) < COLUMN_X_THRESHOLD:
                placed = True
                break

        if not placed:
            columns.append(x)

    columns.sort()
    return columns


def assign_to_columns(row_blocks, columns):
    column_map = defaultdict(str)

    for block in row_blocks:
        x_center, _ = bbox_center(block["bbox"])

        closest_col = min(columns, key=lambda c: abs(c - x_center))
        column_map[closest_col] = block["text"].strip()

    # Preserve left-to-right order
    ordered = [column_map[c] for c in sorted(column_map.keys()) if column_map[c]]
    return ordered


# ---------------------------------------------------
# STEP 3 — Table Extraction
# ---------------------------------------------------
def extract_tables(blocks):

    if not blocks:
        return [], blocks

    # Candidate blocks: likely table content
    candidate_blocks = [
        b for b in blocks
        if b["type"] in ["question", "answer"]
    ]

    if len(candidate_blocks) < 6:
        return [], blocks

    rows = cluster_rows(candidate_blocks)

    # Remove rows that look like footer totals
    filtered_rows = []
    for row in rows:
        texts = [b["text"].lower() for b in row["blocks"]]

        if any("grand total" in t for t in texts):
            continue
        if any("subtotal" in t for t in texts):
            continue

        filtered_rows.append(row)

    if len(filtered_rows) < MIN_ROWS:
        return [], blocks

    columns = detect_columns(filtered_rows)

    if len(columns) < MIN_COLUMNS:
        return [], blocks

    table_rows = []
    used_blocks = set()

    for row in filtered_rows:

        row_cells = assign_to_columns(row["blocks"], columns)

        if len(row_cells) >= MIN_COLUMNS:
            table_rows.append(row_cells)

            for b in row["blocks"]:
                used_blocks.add(tuple(b["bbox"]))

    if len(table_rows) < MIN_ROWS:
        return [], blocks

    # Build final table block
    table_block = {
        "type": "table",
        "text": "\n".join(
            [" | ".join(row) for row in table_rows]
        ),
        "bbox": merge_bbox(
            [b for row in filtered_rows for b in row["blocks"]]
        ),
        "page": blocks[0]["page"],
        "position": -1,
        "confidence": min(b["confidence"] for b in candidate_blocks)
    }

    # Remove original table cell blocks
    remaining_blocks = [
        b for b in blocks
        if tuple(b["bbox"]) not in used_blocks
    ]

    return [table_block], remaining_blocks