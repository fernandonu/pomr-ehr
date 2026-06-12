from sqlalchemy import Column, Integer, String
from app.db.base_class import Base

class SnomedConcept(Base):
    __tablename__ = "snomed_concepts"

    id = Column(Integer, primary_key=True, index=True)
    conceptid = Column(String, unique=True, index=True, nullable=False)
    term = Column(String, index=True, nullable=False)

class SnomedConceptVaccine(Base):
    __tablename__ = "snomed_concepts_vaccine"

    id = Column(Integer, primary_key=True, index=True)
    conceptid = Column(String, unique=True, index=True, nullable=False)
    term = Column(String, index=True, nullable=False)

class SnomedConceptAllergy(Base):
    __tablename__ = "snomed_concepts_allergy"

    id = Column(Integer, primary_key=True, index=True)
    conceptid = Column(String, unique=True, index=True, nullable=False)
    term = Column(String, index=True, nullable=False)

class SnomedConceptMedication(Base):
    __tablename__ = "snomed_concepts_medication"

    id = Column(Integer, primary_key=True, index=True)
    conceptid = Column(String, unique=True, index=True, nullable=False)
    term = Column(String, index=True, nullable=False)

class SnomedConceptProcedure(Base):
    __tablename__ = "snomed_concepts_procedure"

    id = Column(Integer, primary_key=True, index=True)
    conceptid = Column(String, unique=True, index=True, nullable=False)
    term = Column(String, index=True, nullable=False)

class SnomedConceptLaboratory(Base):
    __tablename__ = "snomed_concepts_laboratory"

    id = Column(Integer, primary_key=True, index=True)
    conceptid = Column(String, unique=True, index=True, nullable=False)
    term = Column(String, index=True, nullable=False)

class SnomedConceptMedicationRoute(Base):
    __tablename__ = "snomed_concepts_medication_route_administration"

    id = Column(Integer, primary_key=True, index=True)
    conceptid = Column(String, unique=True, index=True, nullable=False)
    term = Column(String, index=True, nullable=False)
