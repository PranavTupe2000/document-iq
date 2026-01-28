FROM python:3.11-slim

# Use neutral working dir (better than /app here)
WORKDIR /srv

# Copy only pyproject first (layer caching)
COPY components/aggregator/pyproject.toml .

# Copy source code
COPY components/aggregator/src src

# Install aggregator as a package
RUN pip install --upgrade pip && pip install .

# Run as installed module (IMPORTANT)
CMD ["python", "-m", "document_iq_platform_aggregator.main"]
