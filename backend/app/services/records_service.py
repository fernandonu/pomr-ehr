from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.records import Vaccine, Allergy, Procedure, Medication, LabResult
from app.schemas.records import (
    VaccineCreate, AllergyCreate, ProcedureCreate, MedicationCreate, LabResultCreate
)
from typing import List

async def get_patient_records(db: AsyncSession, paciente_id: int):
    # This is a generic way to get all records, but let's implement individually for type safety
    vaccines = (await db.execute(select(Vaccine).filter(Vaccine.paciente_id == paciente_id))).scalars().all()
    allergies = (await db.execute(select(Allergy).filter(Allergy.paciente_id == paciente_id))).scalars().all()
    procedures = (await db.execute(select(Procedure).filter(Procedure.paciente_id == paciente_id))).scalars().all()
    medications = (await db.execute(select(Medication).filter(Medication.paciente_id == paciente_id))).scalars().all()
    labs = (await db.execute(select(LabResult).filter(LabResult.paciente_id == paciente_id))).scalars().all()
    
    return {
        "vaccines": vaccines,
        "allergies": allergies,
        "procedures": procedures,
        "medications": medications,
        "lab_results": labs
    }

async def create_vaccine(db: AsyncSession, item: VaccineCreate) -> Vaccine:
    db_item = Vaccine(**item.model_dump())
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item

async def create_allergy(db: AsyncSession, item: AllergyCreate) -> Allergy:
    db_item = Allergy(**item.model_dump())
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item

async def create_procedure(db: AsyncSession, item: ProcedureCreate) -> Procedure:
    db_item = Procedure(**item.model_dump())
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item

async def create_medication(db: AsyncSession, item: MedicationCreate) -> Medication:
    db_item = Medication(**item.model_dump())
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item

async def create_lab_result(db: AsyncSession, item: LabResultCreate) -> LabResult:
    db_item = LabResult(**item.model_dump())
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item
