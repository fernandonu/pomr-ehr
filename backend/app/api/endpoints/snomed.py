from typing import Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.models.snomed import SnomedConcept
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
