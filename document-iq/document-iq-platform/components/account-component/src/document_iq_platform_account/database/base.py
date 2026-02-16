from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.

    All ORM models in account-component should inherit from this.
    Alembic uses Base.metadata to generate migrations.
    """
    pass
