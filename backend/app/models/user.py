from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.base_class import Base

class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False) # e.g. admin, medico, enfermeria, auditor
    is_active = Column(Boolean, default=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    matricula = Column(String, nullable=True)
    especialidad = Column(String, nullable=True)
    servicio = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
