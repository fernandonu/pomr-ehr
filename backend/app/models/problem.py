from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Problem(Base):
    __tablename__ = "problem"

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("patient.id"), nullable=False)
    snomed_concept_id = Column(String, ForeignKey("snomed_concepts.conceptid"), nullable=False)
    description = Column(String, nullable=False)
    estado = Column(String, nullable=False) # 'activo' or 'inactivo'
    fecha_cambio = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("user.id"), nullable=False)
    
    patient = relationship("Patient", back_populates="problems")
    snomed_concept = relationship("SnomedConcept")
    creator = relationship("User")
    evolutions = relationship("ClinicalEvolution", back_populates="problem", cascade="all, delete-orphan")
