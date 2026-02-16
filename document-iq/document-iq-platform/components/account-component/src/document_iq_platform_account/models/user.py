from sqlalchemy import (
    Column, BigInteger, String, Enum,
    Boolean, ForeignKey, DateTime
)
from sqlalchemy.sql import func
from document_iq_platform_account.database.base import Base
import enum


class RoleEnum(str, enum.Enum):
    ORG_ADMIN = "ORG_ADMIN"
    USER = "USER"


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True)
    organization_id = Column(
        BigInteger,
        ForeignKey("organizations.id"),
        nullable=False
    )
    email = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
