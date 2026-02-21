def bbox_area(bbox: list) -> float:
    x0, y0, x1, y1 = bbox
    return max(0, x1 - x0) * max(0, y1 - y0)


def intersection_area(b1: list, b2: list) -> float:
    x0 = max(b1[0], b2[0])
    y0 = max(b1[1], b2[1])
    x1 = min(b1[2], b2[2])
    y1 = min(b1[3], b2[3])

    if x1 <= x0 or y1 <= y0:
        return 0

    return (x1 - x0) * (y1 - y0)


def overlap_ratio(word_bbox: list, block_bbox: list) -> float:
    inter = intersection_area(word_bbox, block_bbox)
    area = bbox_area(word_bbox)

    if area == 0:
        return 0

    return inter / area