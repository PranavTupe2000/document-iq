from collections import defaultdict


class WorkflowState:
    """
    In-memory workflow state (temporary).
    Replace with Redis / DB later.
    """

    def __init__(self):
        self._state = defaultdict(dict)

    def update(self, request_id: str, key: str, value: dict):
        self._state[request_id][key] = value

    def is_complete(self, request_id: str) -> bool:
        required = {"ocr", "layout", "classification", "rag"}
        return required.issubset(self._state[request_id].keys())

    def get_result(self, request_id: str) -> dict:
        return self._state[request_id]
