from typing import Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.models.snomed import SnomedConcept, SnomedConceptVaccine, SnomedConceptAllergy, SnomedConceptMedication, SnomedConceptProcedure, SnomedConceptLaboratory, SnomedConceptMedicationRoute
from app.schemas.snomed import SnomedConceptResponse

router = APIRouter()

@router.get("/search", response_model=List[SnomedConceptResponse])
async def search_snomed_concepts(
    q: str = Query(..., min_length=3, description="Search term for SNOMED concept"),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Search SNOMED CT concepts by term.
    """
    query = select(SnomedConcept).filter(SnomedConcept.term.ilike(f"%{q}%")).limit(50)
    result = await db.execute(query)
    concepts = result.scalars().all()
    return concepts

@router.get("/search-vaccines", response_model=List[SnomedConceptResponse])
async def search_snomed_concepts_vaccine(
    q: str = Query(..., min_length=3, description="Search term for SNOMED vaccine concept"),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Search SNOMED CT vaccine concepts by term.
    """
    query = select(SnomedConceptVaccine).filter(SnomedConceptVaccine.term.ilike(f"%{q}%")).limit(50)
    result = await db.execute(query)
    concepts = result.scalars().all()
    return concepts

@router.get("/search-allergies", response_model=List[SnomedConceptResponse])
async def search_snomed_concepts_allergy(
    q: str = Query(..., min_length=3, description="Search term for SNOMED allergy concept"),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Search SNOMED CT allergy concepts by term.
    """
    query = select(SnomedConceptAllergy).filter(SnomedConceptAllergy.term.ilike(f"%{q}%")).limit(50)
    result = await db.execute(query)
    concepts = result.scalars().all()
    return concepts

@router.get("/search-medications", response_model=List[SnomedConceptResponse])
async def search_snomed_concepts_medication(
    q: str = Query(..., min_length=3, description="Search term for SNOMED medication concept"),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Search SNOMED CT medication concepts by term.
    """
    query = select(SnomedConceptMedication).filter(SnomedConceptMedication.term.ilike(f"%{q}%")).limit(50)
    result = await db.execute(query)
    concepts = result.scalars().all()
    return concepts

@router.get("/search-procedures", response_model=List[SnomedConceptResponse])
async def search_snomed_concepts_procedure(
    q: str = Query(..., min_length=3, description="Search term for SNOMED procedure concept"),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Search SNOMED CT procedure concepts by term.
    """
    query = select(SnomedConceptProcedure).filter(SnomedConceptProcedure.term.ilike(f"%{q}%")).limit(50)
    result = await db.execute(query)
    concepts = result.scalars().all()
    return concepts

@router.get("/search-labs", response_model=List[SnomedConceptResponse])
async def search_snomed_concepts_laboratory(
    q: str = Query(..., min_length=3, description="Search term for SNOMED laboratory concept"),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Search SNOMED CT laboratory concepts by term.
    """
    query = select(SnomedConceptLaboratory).filter(SnomedConceptLaboratory.term.ilike(f"%{q}%")).limit(50)
    result = await db.execute(query)
    concepts = result.scalars().all()
    return concepts

@router.get("/search-medication-routes", response_model=List[SnomedConceptResponse])
async def search_snomed_concepts_medication_route(
    q: str = Query(..., min_length=3, description="Search term for SNOMED medication route administration concept"),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Search SNOMED CT medication route concepts by term.
    """
    query = select(SnomedConceptMedicationRoute).filter(SnomedConceptMedicationRoute.term.ilike(f"%{q}%")).limit(50)
    result = await db.execute(query)
    concepts = result.scalars().all()
    return concepts
