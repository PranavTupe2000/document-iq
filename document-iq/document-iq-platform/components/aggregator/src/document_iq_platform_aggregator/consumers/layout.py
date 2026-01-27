from platform_shared.messaging.kafka import create_consumer
from document_iq_core.utils import get_logger

from document_iq_platform_aggregator.workflow.state import WorkflowState
from document_iq_platform_aggregator.workflow.idempotency import IdempotencyGuard
from document_iq_platform_aggregator.workflow.retry import (
    should_retry,
    apply_backoff,
)
from document_iq_platform_aggregator.producers.dispatcher import dispatch
from document_iq_platform_aggregator.producers.dlq import send_to_dlq

logger = get_logger("LayoutResultConsumer")

state = WorkflowState()
idempotency = IdempotencyGuard()


def consume_layout():
    consumer = create_consumer(
        topic="document.layout.completed",
        bootstrap_servers="kafka:9092",
        group_id="aggregator-layout",
    )

    for msg in consumer:
        event = msg.value
        request_id = event["request_id"]

        try:
            # Idempotency guard
            if idempotency.is_duplicate(request_id, "layout"):
                continue

            state.update(request_id, "layout", event)

            if state.is_complete(request_id):
                if not idempotency.is_duplicate(request_id, "final"):
                    dispatch(
                        "document.analysis.completed",
                        {
                            "request_id": request_id,
                            "results": state.get_result(request_id),
                        },
                    )
                    state.mark_completed(request_id)

        except Exception as e:
            logger.exception("Error processing layout event")

            event["retry_count"] = event.get("retry_count", 0) + 1
            event["stage"] = "layout"

            if should_retry(event):
                apply_backoff(event)
                dispatch("document.layout.retry", event)
            else:
                send_to_dlq(event, e)
