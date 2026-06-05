from fastapi import APIRouter
from app.api.endpoints import patient, problem, evolution, records, auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(patient.router, prefix="/patients", tags=["patients"])
api_router.include_router(problem.router, prefix="/problems", tags=["problems"])
api_router.include_router(evolution.router, prefix="/evolutions", tags=["evolutions"])
api_router.include_router(records.router, prefix="/records", tags=["clinical_records"])
