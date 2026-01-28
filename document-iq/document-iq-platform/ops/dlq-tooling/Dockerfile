FROM python:3.11-slim

WORKDIR /srv

COPY ops/dlq-tooling/pyproject.toml .

COPY ops/dlq-tooling/src src

RUN pip install --upgrade pip && pip install .

CMD ["python", "-m", "document_iq_dlq_tooling.monitor"]
