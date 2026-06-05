from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate
from typing import List, Optional

async def get_patient(db: AsyncSession, patient_id: int) -> Optional[Patient]:
    result = await db.execute(select(Patient).filter(Patient.id == patient_id))
    return result.scalars().first()

async def get_patients(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Patient]:
    result = await db.execute(select(Patient).offset(skip).limit(limit))
    return result.scalars().all()

async def create_patient(db: AsyncSession, patient: PatientCreate) -> Patient:
    db_patient = Patient(**patient.model_dump())
    db.add(db_patient)
    await db.commit()
    await db.refresh(db_patient)
    return db_patient

async def update_patient(db: AsyncSession, patient_id: int, patient_update: PatientUpdate) -> Optional[Patient]:
    db_patient = await get_patient(db, patient_id)
    if not db_patient:
        return None
    
    update_data = patient_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_patient, key, value)
        
    await db.commit()
    await db.refresh(db_patient)
    return db_patient
