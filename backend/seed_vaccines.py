import asyncio
from app.db.session import AsyncSessionLocal
from app.models.snomed import SnomedConceptVaccine

async def main():
    async with AsyncSessionLocal() as db:
        v3 = SnomedConceptVaccine(conceptid='15685401000119104', term='Vacuna anterior (migrada)')
        db.add(v3)
        try:
            await db.commit()
            print('Vacunas de prueba insertadas')
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
