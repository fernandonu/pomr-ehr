from sqlalchemy import Column, Integer, String
from app.db.base_class import Base

class SnomedConcept(Base):
    __tablename__ = "snomed_concepts"

    id = Column(Integer, primary_key=True, index=True)
    conceptid = Column(String, unique=True, index=True, nullable=False)
    term = Column(String, index=True, nullable=False)
