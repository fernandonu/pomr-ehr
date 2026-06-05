from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.problem import Problem
from app.schemas.problem import ProblemCreate, ProblemUpdate
from typing import List, Optional
import datetime

async def get_problem(db: AsyncSession, problem_id: int) -> Optional[Problem]:
    result = await db.execute(select(Problem).filter(Problem.id == problem_id))
    return result.scalars().first()

async def get_problems_for_patient(db: AsyncSession, paciente_id: int) -> List[Problem]:
    result = await db.execute(select(Problem).filter(Problem.paciente_id == paciente_id).order_by(Problem.created_at.desc()))
    return result.scalars().all()

async def create_problem(db: AsyncSession, problem: ProblemCreate, user_id: int) -> Problem:
    db_problem = Problem(
        **problem.model_dump(),
        created_by=user_id,
        fecha_cambio=datetime.datetime.utcnow()
    )
    db.add(db_problem)
    await db.commit()
    await db.refresh(db_problem)
    return db_problem

async def update_problem_status(db: AsyncSession, problem_id: int, status: str, user_id: int) -> Optional[Problem]:
    # Update status logic according to POMR (active -> inactive). Keep audit.
    db_problem = await get_problem(db, problem_id)
    if not db_problem:
        return None
    
    db_problem.estado = status
    db_problem.fecha_cambio = datetime.datetime.utcnow()
    # Ideally, log the state transition in an audit table or a separate ProblemHistory table
    
    await db.commit()
    await db.refresh(db_problem)
    return db_problem
