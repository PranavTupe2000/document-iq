FROM python:3.11-slim

WORKDIR /srv

COPY components/ingestion-worker/pyproject.toml .
COPY components/ingestion-worker/src src

RUN pip install --upgrade pip && pip install .

CMD ["python", "-m", "document_iq_platform_ingestion.main"]
