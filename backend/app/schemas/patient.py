from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date, datetime

class PatientBase(BaseModel):
    nombre: str
    apellido: str
    documento: str
    fecha_nacimiento: date
    sexo: str

class PatientCreate(PatientBase):
    pass

class PatientUpdate(PatientBase):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    documento: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    sexo: Optional[str] = None

class PatientResponse(PatientBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
