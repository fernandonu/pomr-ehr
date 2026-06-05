from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict
from datetime import datetime

class ClinicalEvolutionBase(BaseModel):
    paciente_id: int
    problema_id: Optional[int] = None
    texto_clinico: str
    estructurado: Optional[Dict[str, Any]] = None

class ClinicalEvolutionCreate(ClinicalEvolutionBase):
    pass

class ClinicalEvolutionResponse(ClinicalEvolutionBase):
    id: int
    autor_id: int
    fecha: datetime
    
    model_config = ConfigDict(from_attributes=True)
