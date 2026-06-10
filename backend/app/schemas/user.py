from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    role: str
    is_active: bool = True
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    matricula: Optional[str] = None
    especialidad: Optional[str] = None
    servicio: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdatePassword(BaseModel):
    password: str

class UserUpdateProfile(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    matricula: Optional[str] = None
    especialidad: Optional[str] = None
    servicio: Optional[str] = None
    role: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
