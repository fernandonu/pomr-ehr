from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.db.session import get_db
from app.schemas.evolution import ClinicalEvolutionCreate, ClinicalEvolutionResponse, EvolutionUpdate
from app.services import evolution_service
from app.api.deps import RequireRole, get_current_active_user
from app.models.evolution import ClinicalEvolution
from app.models.user import User

router = APIRouter()

require_sanitario = RequireRole(["equipo_sanitario"])

@router.get("/problem/{problema_id}", response_model=List[ClinicalEvolutionResponse])
async def list_evolutions_by_problem(problema_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return await evolution_service.get_evolutions_for_problem(db, problema_id)

@router.get("/patient/{paciente_id}", response_model=List[ClinicalEvolutionResponse])
async def list_evolutions_by_patient(paciente_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return await evolution_service.get_evolutions_for_patient(db, paciente_id)

@router.post("/", response_model=ClinicalEvolutionResponse)
async def create_evolution(evolution: ClinicalEvolutionCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_sanitario)):
    return await evolution_service.create_evolution(db, evolution, current_user.id)

@router.put("/{evolution_id}", response_model=ClinicalEvolutionResponse)
async def update_evolution(evolution_id: int, evol_in: EvolutionUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_sanitario)):
    result = await db.execute(select(ClinicalEvolution).filter(ClinicalEvolution.id == evolution_id))
    db_evol = result.scalars().first()
    if not db_evol:
        raise HTTPException(status_code=404, detail="Evolution not found")
        
    if not evol_in.motivo_edicion:
        raise HTTPException(status_code=400, detail="Motivo de edicion es obligatorio")
        
    db_evol.texto_clinico = evol_in.texto_clinico
    db_evol.motivo_edicion = evol_in.motivo_edicion
    db_evol.is_edited = True
    
    if evol_in.peso_kg is not None:
        db_evol.peso_kg = evol_in.peso_kg
    if evol_in.talla_cm is not None:
        db_evol.talla_cm = evol_in.talla_cm
    if evol_in.perimetro_cefalico_cm is not None:
        db_evol.perimetro_cefalico_cm = evol_in.perimetro_cefalico_cm
    if evol_in.tension_arterial is not None:
        db_evol.tension_arterial = evol_in.tension_arterial
        
    await db.commit()
    await db.refresh(db_evol)
    return db_evol
