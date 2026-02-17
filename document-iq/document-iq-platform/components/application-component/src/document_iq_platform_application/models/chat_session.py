from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from document_iq_platform_application.database.base import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer)
    organization_id = Column(Integer)

    messages = relationship("ChatMessage", back_populates="session")
