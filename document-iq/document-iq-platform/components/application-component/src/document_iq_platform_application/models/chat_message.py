from sqlalchemy import Column, Integer, Text, ForeignKey

from document_iq_platform_application.database.base import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer)
    role = Column(Text)  # user / assistant
    content = Column(Text)
