from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from platform_shared.config.settings import Settings

settings = Settings()

def setup_tracing():
    resource = Resource(attributes={
        "service.name": settings.service_name
    })

    provider = TracerProvider(resource=resource)
    trace.set_tracer_provider(provider)

    exporter = OTLPSpanExporter(
        endpoint=settings.tempo_endpoint,
        insecure=True,
    )

    span_processor = BatchSpanProcessor(exporter)
    provider.add_span_processor(span_processor)