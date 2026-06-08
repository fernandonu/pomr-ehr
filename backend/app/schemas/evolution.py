from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict
from datetime import datetime

class ClinicalEvolutionBase(BaseModel):
    paciente_id: int
    problema_id: Optional[int] = None
    peso_kg: Optional[float] = None
    talla_cm: Optional[float] = None
    perimetro_cefalico_cm: Optional[float] = None
    tension_arterial: Optional[str] = None
    texto_clinico: str
    estructurado: Optional[Dict[str, Any]] = None
    is_edited: Optional[bool] = False
    motivo_edicion: Optional[str] = None
    updated_at: Optional[datetime] = None

class ClinicalEvolutionCreate(ClinicalEvolutionBase):
    pass

class ClinicalEvolutionResponse(ClinicalEvolutionBase):
    id: int
    autor_id: int
    fecha: datetime
    
    model_config = ConfigDict(from_attributes=True)

class EvolutionUpdate(BaseModel):
    texto_clinico: str
    motivo_edicion: str
    peso_kg: Optional[float] = None
    talla_cm: Optional[float] = None
    perimetro_cefalico_cm: Optional[float] = None
    tension_arterial: Optional[str] = None
