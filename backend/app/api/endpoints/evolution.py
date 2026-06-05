from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.session import get_db
from app.schemas.evolution import ClinicalEvolutionCreate, ClinicalEvolutionResponse
from app.services import evolution_service

router = APIRouter()

# MOCK User ID for now until Auth is implemented
def get_current_user_id() -> int:
    return 1

@router.get("/problem/{problema_id}", response_model=List[ClinicalEvolutionResponse])
async def list_evolutions_by_problem(problema_id: int, db: AsyncSession = Depends(get_db)):
    return await evolution_service.get_evolutions_for_problem(db, problema_id)

@router.get("/patient/{paciente_id}", response_model=List[ClinicalEvolutionResponse])
async def list_evolutions_by_patient(paciente_id: int, db: AsyncSession = Depends(get_db)):
    return await evolution_service.get_evolutions_for_patient(db, paciente_id)

@router.post("/", response_model=ClinicalEvolutionResponse)
async def create_evolution(evolution: ClinicalEvolutionCreate, db: AsyncSession = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return await evolution_service.create_evolution(db, evolution, current_user_id)
