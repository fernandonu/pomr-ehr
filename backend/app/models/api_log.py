from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class ApiLog(Base):
    __tablename__ = "api_log"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patient.id", ondelete="SET NULL"), nullable=True)
    endpoint = Column(String, nullable=False)
    method = Column(String, nullable=False)
    request_payload = Column(Text, nullable=True)
    response_payload = Column(Text, nullable=True)
    status_code = Column(Integer, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient")
