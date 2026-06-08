from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.session import get_db
from app.schemas.problem import ProblemCreate, ProblemResponse, ProblemUpdate
from app.services import problem_service

from app.api.deps import RequireRole, get_current_active_user
from app.models.user import User

router = APIRouter()
require_sanitario = RequireRole(["equipo_sanitario"])

@router.get("/patient/{paciente_id}", response_model=List[ProblemResponse])
async def list_problems(paciente_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    problems = await problem_service.get_problems_for_patient(db, paciente_id)
    return problems

@router.post("/", response_model=ProblemResponse)
async def create_problem(problem: ProblemCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_sanitario)):
    return await problem_service.create_problem(db, problem, current_user.id)

@router.put("/{problem_id}/status", response_model=ProblemResponse)
async def update_problem_status(problem_id: int, status: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_sanitario)):
    problem = await problem_service.update_problem_status(db, problem_id, status, current_user.id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem
