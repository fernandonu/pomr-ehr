from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Patient(Base):
    __tablename__ = "patient"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    apellido_materno = Column(String, nullable=True)
    documento = Column(String, unique=True, index=True, nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)
    sexo = Column(String, nullable=False)
    telefono = Column(String, nullable=True)
    cobertura = Column(String, nullable=True)
    calle = Column(String, nullable=True)
    numero = Column(String, nullable=True)
    piso = Column(String, nullable=True)
    departamento = Column(String, nullable=True)
    cpostal = Column(String, nullable=True)
    barrio = Column(String, nullable=True)
    monoblock = Column(String, nullable=True)
    ciudad = Column(String, nullable=True)
    municipio = Column(String, nullable=True)
    provincia = Column(String, nullable=True)
    pais = Column(String, nullable=True)
    latitud = Column(Float, nullable=True)
    longitud = Column(Float, nullable=True)
    federation_id = Column(String, nullable=True)
    federated_by = Column(Integer, ForeignKey("user.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    problems = relationship("Problem", back_populates="patient", cascade="all, delete-orphan")
    evolutions = relationship("ClinicalEvolution", back_populates="patient", cascade="all, delete-orphan")
    vaccines = relationship("Vaccine", back_populates="patient", cascade="all, delete-orphan")
    allergies = relationship("Allergy", back_populates="patient", cascade="all, delete-orphan")
    procedures = relationship("Procedure", back_populates="patient", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="patient", cascade="all, delete-orphan")
    lab_results = relationship("LabResult", back_populates="patient", cascade="all, delete-orphan")
