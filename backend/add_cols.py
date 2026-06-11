import asyncio
import asyncpg

async def run():
    conn = await asyncpg.connect(user='pomr_user', password='pomr_password', database='pomr_db', host='localhost')
    cols = ['calle', 'numero', 'piso', 'departamento', 'cpostal', 'barrio', 'monoblock', 'ciudad', 'municipio', 'provincia', 'pais']
    for c in cols:
        await conn.execute(f'ALTER TABLE patient ADD COLUMN IF NOT EXISTS {c} VARCHAR;')
    await conn.close()
    print('Postgres DB updated')

asyncio.run(run())
