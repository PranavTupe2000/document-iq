FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /srv

COPY components/rag-engine/pyproject.toml .
COPY components/rag-engine/src src

RUN pip install --upgrade pip && pip install .
RUN mkdir -p /srv/chroma_data

CMD ["python", "-m", "document_iq_platform_rag.main"]
