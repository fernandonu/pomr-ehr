import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def purge_tables():
    async with AsyncSessionLocal() as db:
        await db.execute(text("DELETE FROM allergy"))
        await db.execute(text("DELETE FROM medication"))
        await db.commit()
        print("Tablas purgadas con éxito")

if __name__ == "__main__":
    asyncio.run(purge_tables())
