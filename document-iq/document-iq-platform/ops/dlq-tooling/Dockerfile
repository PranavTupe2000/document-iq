FROM python:3.11-slim

WORKDIR /srv

COPY ops/dlq-tooling/pyproject.toml .
RUN pip install --upgrade pip && pip install .

COPY ops/dlq-tooling/src src

CMD ["python", "-m", "document_iq_dlq_tooling.monitor"]
