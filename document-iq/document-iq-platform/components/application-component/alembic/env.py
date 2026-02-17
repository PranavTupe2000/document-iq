from logging.config import fileConfig
from pathlib import Path
from sqlalchemy import engine_from_config, pool
from alembic import context

from document_iq_platform_application.database.base import Base
from document_iq_platform_application.models import (
    group,
    document,
    processing_job,
    chat_session,
    chat_message,
)
from platform_shared.config.settings import Settings

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata
settings = Settings(
    _env_file=str(Path(__file__).resolve().parents[1] / ".env")
)

if not settings.database_url:
    raise RuntimeError(
        "Missing database URL. Set DOCUMENT_IQ_DATABASE_URL in your environment or .env before running Alembic."
    )

config.set_main_option("sqlalchemy.url", settings.database_url)

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
