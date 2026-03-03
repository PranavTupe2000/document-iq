FROM python:3.11-slim

WORKDIR /srv

COPY components/layout-engine/pyproject.toml .
COPY components/layout-engine/src src

RUN pip install --upgrade pip && pip install .

CMD ["python", "-m", "document_iq_platform_layout.main"]
