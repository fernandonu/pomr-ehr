import os
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from dotenv import set_key
from app.core.config import settings
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

class SettingsUpdate(BaseModel):
    NODO_BASE_URL: str
    URL_ALTA_ABM_DOMINIO: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    CODIGO_REFES: str

@router.get("/")
def get_settings(current_user: User = Depends(get_current_user)):
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return {
        "NODO_BASE_URL": settings.NODO_BASE_URL,
        "URL_ALTA_ABM_DOMINIO": settings.URL_ALTA_ABM_DOMINIO,
        "ACCESS_TOKEN_EXPIRE_MINUTES": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        "CODIGO_REFES": settings.CODIGO_REFES
    }

@router.put("/")
def update_settings(
    settings_in: SettingsUpdate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Update in memory
    settings.NODO_BASE_URL = settings_in.NODO_BASE_URL
    settings.URL_ALTA_ABM_DOMINIO = settings_in.URL_ALTA_ABM_DOMINIO
    settings.ACCESS_TOKEN_EXPIRE_MINUTES = settings_in.ACCESS_TOKEN_EXPIRE_MINUTES
    settings.CODIGO_REFES = settings_in.CODIGO_REFES
    
    # Save to .env file to persist across restarts
    env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
    
    # If the file doesn't exist, create it
    if not os.path.exists(env_file):
        with open(env_file, 'w') as f:
            pass
            
    set_key(env_file, "NODO_BASE_URL", settings_in.NODO_BASE_URL)
    set_key(env_file, "URL_ALTA_ABM_DOMINIO", settings_in.URL_ALTA_ABM_DOMINIO)
    set_key(env_file, "ACCESS_TOKEN_EXPIRE_MINUTES", str(settings_in.ACCESS_TOKEN_EXPIRE_MINUTES))
    set_key(env_file, "CODIGO_REFES", settings_in.CODIGO_REFES)
    
    return {"status": "success", "message": "Settings updated successfully"}
