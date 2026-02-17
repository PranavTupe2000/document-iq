from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from document_iq_platform_application.database.base import Base


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, nullable=False)
    name = Column(String(255), nullable=False)

    documents = relationship("Document", back_populates="group")
