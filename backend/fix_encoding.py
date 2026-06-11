import asyncio
import sys
import os

# Append current directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.base import Base
from app.db.session import AsyncSessionLocal
from app.models.patient import Patient
from sqlalchemy.future import select

def fix_string(s):
    if not s: return s
    try:
        # Check if the string actually has weird characters like Ã
        if 'Ã' in s:
            # Re-encode to latin-1 to get original bytes, decode as utf-8
            return s.encode('latin-1').decode('utf-8')
    except Exception:
        pass
    return s

async def fix():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Patient))
        patients = result.scalars().all()
        for p in patients:
            changed = False
            
            new_nombre = fix_string(p.nombre)
            if new_nombre != p.nombre:
                p.nombre = new_nombre
                changed = True
                
            new_apellido = fix_string(p.apellido)
            if new_apellido != p.apellido:
                p.apellido = new_apellido
                changed = True
                
            new_apellido_m = fix_string(p.apellido_materno)
            if new_apellido_m != p.apellido_materno:
                p.apellido_materno = new_apellido_m
                changed = True
                
            new_calle = fix_string(p.calle)
            if new_calle != p.calle:
                p.calle = new_calle
                changed = True
                
            if changed:
                print(f"Fixed {p.id}: {p.nombre} {p.apellido}")
                
        await db.commit()
        print("Done!")

asyncio.run(fix())
