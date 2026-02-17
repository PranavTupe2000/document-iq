from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship

from document_iq_platform_application.database.base import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"))
    file_name = Column(String(255))
    classification = Column(String(100))
    layout_result = Column(Text)
    rag_result = Column(Text)

    group = relationship("Group", back_populates="documents")
