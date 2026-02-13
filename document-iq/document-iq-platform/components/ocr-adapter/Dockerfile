FROM python:3.11-slim

WORKDIR /srv

COPY components/ocr-worker/pyproject.toml .
COPY components/ocr-worker/src src

RUN pip install --upgrade pip && pip install .

CMD ["python", "-m", "document_iq_platform_ocr.main"]
