from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.evolution import ClinicalEvolution
from app.schemas.evolution import ClinicalEvolutionCreate
from typing import List, Optional

async def get_evolutions_for_problem(db: AsyncSession, problema_id: int) -> List[ClinicalEvolution]:
    result = await db.execute(select(ClinicalEvolution).filter(ClinicalEvolution.problema_id == problema_id).order_by(ClinicalEvolution.fecha.asc()))
    return result.scalars().all()

async def get_evolutions_for_patient(db: AsyncSession, paciente_id: int) -> List[ClinicalEvolution]:
    result = await db.execute(select(ClinicalEvolution).filter(ClinicalEvolution.paciente_id == paciente_id).order_by(ClinicalEvolution.fecha.asc()))
    return result.scalars().all()

async def create_evolution(db: AsyncSession, evolution: ClinicalEvolutionCreate, user_id: int) -> ClinicalEvolution:
    db_evolution = ClinicalEvolution(
        **evolution.model_dump(),
        autor_id=user_id
    )
    db.add(db_evolution)
    await db.commit()
    await db.refresh(db_evolution)
    return db_evolution
