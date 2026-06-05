from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
from app.db.session import get_db
from app.services import records_service
from app.schemas.records import (
    VaccineCreate, VaccineResponse,
    AllergyCreate, AllergyResponse,
    ProcedureCreate, ProcedureResponse,
    MedicationCreate, MedicationResponse,
    LabResultCreate, LabResultResponse
)

router = APIRouter()

@router.get("/patient/{paciente_id}")
async def list_patient_records(paciente_id: int, db: AsyncSession = Depends(get_db)):
    """Returns all clinical records for a patient in a unified response."""
    return await records_service.get_patient_records(db, paciente_id)

@router.post("/vaccine", response_model=VaccineResponse)
async def create_vaccine(item: VaccineCreate, db: AsyncSession = Depends(get_db)):
    return await records_service.create_vaccine(db, item)

@router.post("/allergy", response_model=AllergyResponse)
async def create_allergy(item: AllergyCreate, db: AsyncSession = Depends(get_db)):
    return await records_service.create_allergy(db, item)

@router.post("/procedure", response_model=ProcedureResponse)
async def create_procedure(item: ProcedureCreate, db: AsyncSession = Depends(get_db)):
    return await records_service.create_procedure(db, item)

@router.post("/medication", response_model=MedicationResponse)
async def create_medication(item: MedicationCreate, db: AsyncSession = Depends(get_db)):
    return await records_service.create_medication(db, item)

@router.post("/lab_result", response_model=LabResultResponse)
async def create_lab_result(item: LabResultCreate, db: AsyncSession = Depends(get_db)):
    return await records_service.create_lab_result(db, item)
