import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect('postgresql://pomr_user:pomr_password@localhost:5432/pomr_db')
    try:
        await conn.execute('ALTER TABLE patient ADD COLUMN cobertura VARCHAR;')
        print('Columna cobertura agregada con exito.')
    except asyncpg.exceptions.DuplicateColumnError:
        print('La columna ya existe.')
    await conn.close()

asyncio.run(main())
