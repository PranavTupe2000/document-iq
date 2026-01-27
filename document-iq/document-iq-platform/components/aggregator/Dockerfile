FROM python:3.11-slim

# Use neutral working dir (better than /app here)
WORKDIR /srv

# Copy only pyproject first (layer caching)
COPY components/aggregator/pyproject.toml .

# Install aggregator as a package
RUN pip install --upgrade pip && pip install .

# Copy source code
COPY components/aggregator/src src

# Run as installed module (IMPORTANT)
CMD ["python", "-m", "document_iq_platform_aggregator.main"]
