from sqlalchemy import Column, BigInteger, String, Boolean, DateTime
from sqlalchemy.sql import func
from document_iq_platform_account.database.base import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
