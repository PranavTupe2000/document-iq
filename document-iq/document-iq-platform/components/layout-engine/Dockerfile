FROM python:3.11-slim

WORKDIR /srv

COPY components/layout-worker/pyproject.toml .
COPY components/layout-worker/src src

RUN pip install --upgrade pip && pip install .

CMD ["python", "-m", "document_iq_platform_layout.main"]
