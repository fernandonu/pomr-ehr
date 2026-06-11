from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date, datetime

class PatientBase(BaseModel):
    nombre: str
    apellido: str
    apellido_materno: Optional[str] = None
    documento: str
    fecha_nacimiento: date
    sexo: str
    telefono: Optional[str] = None
    cobertura: Optional[str] = None
    calle: Optional[str] = None
    numero: Optional[str] = None
    piso: Optional[str] = None
    departamento: Optional[str] = None
    cpostal: Optional[str] = None
    barrio: Optional[str] = None
    monoblock: Optional[str] = None
    ciudad: Optional[str] = None
    municipio: Optional[str] = None
    provincia: Optional[str] = None
    pais: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
class PatientCreate(PatientBase):
    pass

class PatientUpdate(PatientBase):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    apellido_materno: Optional[str] = None
    documento: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    sexo: Optional[str] = None
    telefono: Optional[str] = None
    cobertura: Optional[str] = None
    calle: Optional[str] = None
    numero: Optional[str] = None
    piso: Optional[str] = None
    departamento: Optional[str] = None
    cpostal: Optional[str] = None
    barrio: Optional[str] = None
    monoblock: Optional[str] = None
    ciudad: Optional[str] = None
    municipio: Optional[str] = None
    provincia: Optional[str] = None
    pais: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
class PatientResponse(PatientBase):
    id: int
    created_at: datetime
    federation_id: Optional[str] = None
    federated_by: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)
