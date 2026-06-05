from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class SnomedConceptBase(BaseModel):
    conceptid: str
    term: str

class SnomedConceptResponse(SnomedConceptBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

class ProblemBase(BaseModel):
    paciente_id: int
    snomed_concept_id: str
    description: str
    estado: str # 'activo' or 'inactivo'

class ProblemCreate(ProblemBase):
    pass

class ProblemUpdate(BaseModel):
    estado: Optional[str] = None
    description: Optional[str] = None

class ProblemResponse(ProblemBase):
    id: int
    fecha_cambio: datetime
    created_at: datetime
    created_by: int
    
    model_config = ConfigDict(from_attributes=True)
