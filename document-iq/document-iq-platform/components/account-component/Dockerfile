FROM python:3.11-slim

# ---------------------------------
# Set working directory
# ---------------------------------
WORKDIR /srv

# ---------------------------------
# Copy project files (use full paths)
# ---------------------------------
COPY components/account-component/pyproject.toml /srv/pyproject.toml
COPY components/account-component/src /srv/src
COPY components/account-component/alembic /srv/alembic
COPY components/account-component/alembic.ini /srv/alembic.ini

# ---------------------------------
# Install dependencies
# ---------------------------------
RUN pip install --upgrade pip setuptools wheel && pip install --no-cache-dir .

# ---------------------------------
# Expose service port
# ---------------------------------
EXPOSE 8001

# ---------------------------------
# Start: Run migrations → Start app
# ---------------------------------
CMD ["bash", "-c", "alembic upgrade head && uvicorn document_iq_platform_account.main:app --host 0.0.0.0 --port 8001"]