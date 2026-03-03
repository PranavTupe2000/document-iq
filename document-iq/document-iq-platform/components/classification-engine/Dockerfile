FROM python:3.11-slim

WORKDIR /srv

COPY components/classification-engine/pyproject.toml .
COPY components/classification-engine/src src

RUN pip install --upgrade pip && pip install .

CMD ["python", "-m", "document_iq_platform_classification.main"]
