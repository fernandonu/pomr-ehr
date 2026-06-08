import asyncio
import os
import sys

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.future import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash

async def create_superadmin():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).filter(User.username == "admin"))
        user = result.scalars().first()
        if user:
            print("Superadmin user 'admin' already exists.")
            return

        print("Creating superadmin user 'admin'...")
        superadmin = User(
            username="admin",
            hashed_password=get_password_hash("admin123"),
            role="superadmin",
            is_active=True
        )
        db.add(superadmin)
        await db.commit()
        print("Superadmin user created successfully with password 'admin123'")

if __name__ == "__main__":
    asyncio.run(create_superadmin())
