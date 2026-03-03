FROM python:3.11.11-slim-bookworm

WORKDIR /srv

# Copy only pyproject first (layer caching)
COPY components/account-component/pyproject.toml .

# Copy source code
COPY components/account-component/src src

RUN pip install --upgrade pip setuptools wheel && pip install --no-cache-dir .

EXPOSE 8002

CMD ["bash", "-c", "alembic upgrade head && uvicorn document_iq_platform_application.main:app --host 0.0.0.0 --port 8002"]