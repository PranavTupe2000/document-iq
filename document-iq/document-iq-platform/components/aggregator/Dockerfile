FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install --upgrade pip && pip install .

COPY app app

CMD ["python", "app/document_iq_platform_aggregator/main.py"]
