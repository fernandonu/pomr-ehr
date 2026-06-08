from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.session import get_db
from app.schemas.patient import PatientCreate, PatientResponse, PatientUpdate
from app.services import patient_service
from app.api.deps import RequireRole, get_current_active_user
from app.models.user import User

router = APIRouter()

require_admin = RequireRole(["administrativo"])

@router.get("/", response_model=List[PatientResponse])
async def list_patients(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    patients = await patient_service.get_patients(db, skip=skip, limit=limit)
    return patients

@router.post("/", response_model=PatientResponse)
async def create_patient(patient: PatientCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_admin)):
    return await patient_service.create_patient(db, patient)

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    patient = await patient_service.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(patient_id: int, patient_update: PatientUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_admin)):
    patient = await patient_service.update_patient(db, patient_id, patient_update)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
