from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.db.session import get_db
from app.schemas.user import UserCreate, UserResponse, UserUpdatePassword
from app.models.user import User
from app.core.security import get_password_hash
from app.api.deps import RequireRole

router = APIRouter()

# Only superadmin can manage users
require_superadmin = RequireRole([]) # The deps logic says superadmin ALWAYS passes, but let's be explicit just in case. Wait, empty list means ONLY superadmin can pass.

@router.get("/", response_model=List[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db), current_user: User = Depends(require_superadmin)):
    result = await db.execute(select(User))
    return result.scalars().all()

@router.post("/", response_model=UserResponse)
async def create_user(user_in: UserCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_superadmin)):
    result = await db.execute(select(User).filter(User.username == user_in.username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Username already registered")
        
    db_user = User(
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        is_active=user_in.is_active
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@router.put("/{user_id}/password", response_model=UserResponse)
async def update_password(user_id: int, user_in: UserUpdatePassword, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_superadmin)):
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = get_password_hash(user_in.password)
    await db.commit()
    await db.refresh(user)
    return user
