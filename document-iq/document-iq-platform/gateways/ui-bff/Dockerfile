FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Neutral, consistent working dir
WORKDIR /srv

# Copy shared package (must be inside build context)
COPY shared /shared

# Copy pyproject first for caching
COPY gateways/ui-bff/pyproject.toml .

# Copy source code
COPY gateways/ui-bff/src src

# Install dependencies + UI-BFF package
RUN pip install --upgrade pip && pip install .

EXPOSE 8000

# Run as module (IMPORTANT)
CMD ["uvicorn", "document_iq_ui_bff.main:app", "--host", "0.0.0.0", "--port", "8000"]
