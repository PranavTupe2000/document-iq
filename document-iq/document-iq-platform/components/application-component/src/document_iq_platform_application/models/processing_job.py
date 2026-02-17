from sqlalchemy import Column, Integer, String

from document_iq_platform_application.database.base import Base


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer)
    status = Column(String(50))  # pending, processing, completed, failed
