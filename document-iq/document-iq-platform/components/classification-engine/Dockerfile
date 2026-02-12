FROM python:3.11-slim

WORKDIR /srv

COPY components/classification-worker/pyproject.toml .
COPY components/classification-worker/src src

RUN pip install --upgrade pip && pip install .

CMD ["python", "-m", "document_iq_platform_classification.main"]
