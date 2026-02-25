import re

def vertical_overlap_ratio(b1, b2):
    y0 = max(b1[1], b2[1])
    y1 = min(b1[3], b2[3])

    overlap = max(0, y1 - y0)
    height = min(b1[3] - b1[1], b2[3] - b2[1])

    if height == 0:
        return 0

    return overlap / height


def horizontal_distance(q_bbox, a_bbox):
    # distance from right of question to left of answer
    return a_bbox[0] - q_bbox[2]

def spatial_pair_questions_answers(blocks):

    questions = [
        b for b in blocks
        if b["type"] == "question" and b["text"].strip()
    ]

    answers = [
        b for b in blocks
        if b["type"] == "answer" and b["text"].strip()
    ]

    paired_answers = set()
    qa_pairs = []

    for q in questions:

        best_candidate = None
        best_score = float("inf")

        for idx, a in enumerate(answers):

            if idx in paired_answers:
                continue

            # Rule 1: Same page
            if q["page"] != a["page"]:
                continue

            # Rule 2: Vertical overlap
            overlap = vertical_overlap_ratio(
                q["bbox"], a["bbox"]
            )

            if overlap < 0.4:
                continue

            # Rule 3: Answer should be right of question
            dist = horizontal_distance(
                q["bbox"], a["bbox"]
            )

            if dist < -10:  # allow small overlap tolerance
                continue

            # Score by horizontal distance
            if dist < best_score:
                best_score = dist
                best_candidate = idx

        if best_candidate is not None:
            paired_answers.add(best_candidate)

            qa_pairs.append({
                "question": q["text"],
                "answer": answers[best_candidate]["text"],
                "question_bbox": q["bbox"],
                "answer_bbox": answers[best_candidate]["bbox"],
                "confidence": min(
                    q["confidence"],
                    answers[best_candidate]["confidence"]
                )
            })

    return qa_pairs

def is_date(text):
    return bool(
        re.search(r"\d{1,2}/\d{1,2}/\d{2,4}", text)
        or re.search(r"\b\d{4}\b", text)
    )


def is_numeric(text):
    return bool(re.fullmatch(r"[0-9\s\.,]+", text.strip()))


def apply_layout_heuristics(qa_pairs):

    refined_pairs = []

    for pair in qa_pairs:

        q_text = pair["question"].lower()
        a_text = pair["answer"]

        # Heuristic 1: Date field validation
        if "date" in q_text and not is_date(a_text):
            continue

        # Heuristic 2: Cost / amount validation
        if any(word in q_text for word in ["cost", "amount", "total"]):
            if not is_numeric(a_text):
                continue

        # Heuristic 3: Remove empty answers
        if not a_text.strip():
            continue

        refined_pairs.append(pair)

    return refined_pairs

# def is_table_candidate(blocks):
#     """
#     Detect if page contains multi-column aligned numeric structure.
#     Simple heuristic:
#     - Multiple numeric answers aligned vertically
#     - Multiple questions aligned left
#     """
#     numeric_answers = [
#         b for b in blocks
#         if b["type"] == "answer"
#         and any(char.isdigit() for char in b["text"])
#     ]

#     return len(numeric_answers) > 5

def pair_questions_answers(blocks):

    qa_pairs = spatial_pair_questions_answers(blocks)

    qa_pairs = apply_layout_heuristics(qa_pairs)

    return qa_pairs