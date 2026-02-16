from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from platform_shared.config.settings import Settings

settings = Settings()

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)
