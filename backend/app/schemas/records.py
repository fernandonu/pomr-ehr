from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime

class VaccineBase(BaseModel):
    paciente_id: int
    snomed_concept_id: str
    descripcion: Optional[str] = None
    fecha: date
    lote: Optional[str] = None
    observaciones: Optional[str] = None

class VaccineCreate(VaccineBase):
    pass

class VaccineResponse(VaccineBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AllergyBase(BaseModel):
    paciente_id: int
    snomed_concept_id: str
    descripcion: Optional[str] = None
    severidad: Optional[str] = None
    reaccion: Optional[str] = None
    reaccion_snomed_id: Optional[str] = None
    estado: str

class AllergyCreate(AllergyBase):
    pass

class AllergyResponse(AllergyBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ProcedureBase(BaseModel):
    paciente_id: int
    snomed_concept_id: str
    descripcion: Optional[str] = None
    fecha: date
    observaciones: Optional[str] = None

class ProcedureCreate(ProcedureBase):
    pass

class ProcedureResponse(ProcedureBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MedicationBase(BaseModel):
    paciente_id: int
    problema_id: int
    snomed_concept_id: str
    descripcion: Optional[str] = None
    dosis: Optional[str] = None
    frecuencia: Optional[str] = None
    via: Optional[str] = None
    via_snomed_id: Optional[str] = None
    fecha_inicio: date
    fecha_fin: Optional[date] = None
    estado: str

class MedicationCreate(MedicationBase):
    pass

class MedicationResponse(MedicationBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LabResultBase(BaseModel):
    paciente_id: int
    snomed_concept_id: str
    descripcion: Optional[str] = None
    fecha: date
    resultado: str
    unidad: Optional[str] = None
    referencia: Optional[str] = None

class LabResultCreate(LabResultBase):
    pass

class LabResultResponse(LabResultBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
