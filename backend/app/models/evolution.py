from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, JSON, Float, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class ClinicalEvolution(Base):
    __tablename__ = "clinical_evolution"

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("patient.id"), nullable=False)
    problema_id = Column(Integer, ForeignKey("problem.id"), nullable=True) # Optional, can be a general evolution
    autor_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    fecha = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    peso_kg = Column(Float, nullable=True)
    talla_cm = Column(Float, nullable=True)
    perimetro_cefalico_cm = Column(Float, nullable=True)
    tension_arterial = Column(String, nullable=True)
    texto_clinico = Column(Text, nullable=False)
    estructurado = Column(JSON, nullable=True)
    is_edited = Column(Boolean, default=False)
    motivo_edicion = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    patient = relationship("Patient", back_populates="evolutions")
    problem = relationship("Problem", back_populates="evolutions")
    author = relationship("User")
