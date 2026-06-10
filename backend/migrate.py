import asyncio
from sqlalchemy import text
from app.db.session import engine

async def migrate():
    async with engine.begin() as conn:
        try:
            await conn.execute(text('ALTER TABLE "user" ADD COLUMN first_name VARCHAR;'))
            await conn.execute(text('ALTER TABLE "user" ADD COLUMN last_name VARCHAR;'))
            await conn.execute(text('ALTER TABLE "user" ADD COLUMN matricula VARCHAR;'))
            await conn.execute(text('ALTER TABLE "user" ADD COLUMN especialidad VARCHAR;'))
            await conn.execute(text('ALTER TABLE "user" ADD COLUMN servicio VARCHAR;'))
            print('User columns added.')
        except Exception as e:
            print('User columns error:', e)
        
        try:
            await conn.execute(text('ALTER TABLE allergy ADD COLUMN reaccion_snomed_id VARCHAR;'))
            print('Allergy columns added.')
        except Exception as e:
            print('Allergy columns error:', e)

asyncio.run(migrate())
