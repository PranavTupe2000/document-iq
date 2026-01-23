from platform_shared.messaging.kafka import create_consumer
from document_iq_core.utils import get_logger
from document_iq_platform_aggregator.workflow.state import WorkflowState
from document_iq_platform_aggregator.producers.dispatcher import dispatch

logger = get_logger("LayoutResultConsumer")
state = WorkflowState()


def consume_layout():
    consumer = create_consumer(
        topic="document.layout.completed",
        bootstrap_servers="kafka:9092",
        group_id="aggregator-layout",
    )

    for msg in consumer:
        event = msg.value
        request_id = event["request_id"]

        state.update(request_id, "layout", event)

        if state.is_complete(request_id):
            dispatch(
                "document.analysis.completed",
                {
                    "request_id": request_id,
                    "results": state.get_result(request_id),
                },
            )
