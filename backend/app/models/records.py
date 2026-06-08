from sqlalchemy import Column, Integer, String, ForeignKey, Date, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Vaccine(Base):
    __tablename__ = "vaccine"
    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("patient.id"), nullable=False)
    snomed_concept_id = Column(String, ForeignKey("snomed_concepts.conceptid"), nullable=False)
    descripcion = Column(String, nullable=True)
    fecha = Column(Date, nullable=False)
    lote = Column(String, nullable=True)
    observaciones = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    patient = relationship("Patient", back_populates="vaccines")
    snomed_concept = relationship("SnomedConcept")

class Allergy(Base):
    __tablename__ = "allergy"
    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("patient.id"), nullable=False)
    snomed_concept_id = Column(String, ForeignKey("snomed_concepts.conceptid"), nullable=False)
    descripcion = Column(String, nullable=True)
    severidad = Column(String, nullable=True)
    reaccion = Column(String, nullable=True)
    estado = Column(String, nullable=False) # e.g. activo, inactivo
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    patient = relationship("Patient", back_populates="allergies")
    snomed_concept = relationship("SnomedConcept")

class Procedure(Base):
    __tablename__ = "procedure"
    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("patient.id"), nullable=False)
    snomed_concept_id = Column(String, ForeignKey("snomed_concepts.conceptid"), nullable=False)
    descripcion = Column(String, nullable=True)
    fecha = Column(Date, nullable=False)
    observaciones = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    patient = relationship("Patient", back_populates="procedures")
    snomed_concept = relationship("SnomedConcept")

class Medication(Base):
    __tablename__ = "medication"
    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("patient.id"), nullable=False)
    snomed_concept_id = Column(String, ForeignKey("snomed_concepts.conceptid"), nullable=False)
    descripcion = Column(String, nullable=True)
    dosis = Column(String, nullable=True)
    frecuencia = Column(String, nullable=True)
    via = Column(String, nullable=True)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=True)
    estado = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    patient = relationship("Patient", back_populates="medications")
    snomed_concept = relationship("SnomedConcept")

class LabResult(Base):
    __tablename__ = "lab_result"
    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("patient.id"), nullable=False)
    snomed_concept_id = Column(String, ForeignKey("snomed_concepts.conceptid"), nullable=False)
    descripcion = Column(String, nullable=True)
    fecha = Column(Date, nullable=False)
    resultado = Column(String, nullable=False)
    unidad = Column(String, nullable=True)
    referencia = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    patient = relationship("Patient", back_populates="lab_results")
    snomed_concept = relationship("SnomedConcept")
