FROM python:3.11-slim

WORKDIR /srv

# Copy only pyproject first (layer caching)
COPY components/account-component/pyproject.toml .

# Copy source code
COPY components/account-component/src src

RUN pip install --upgrade pip && pip install .

EXPOSE 8001

CMD ["uvicorn", "document_iq_account.main:app", "--host", "0.0.0.0", "--port", "8001"]
