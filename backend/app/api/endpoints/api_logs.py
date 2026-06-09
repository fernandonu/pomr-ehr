from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any
from app.db.session import get_db
from app.api.deps import RequireRole
from app.models.api_log import ApiLog
from app.models.user import User

router = APIRouter()

require_superadmin = RequireRole(["superadmin"])

@router.get("/", response_model=List[Dict[str, Any]])
async def get_api_logs(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_superadmin)):
    result = await db.execute(
        select(ApiLog).order_by(ApiLog.timestamp.desc()).offset(skip).limit(limit)
    )
    logs = result.scalars().all()
    
    return [
        {
            "id": log.id,
            "patient_id": log.patient_id,
            "endpoint": log.endpoint,
            "method": log.method,
            "request_payload": log.request_payload,
            "response_payload": log.response_payload,
            "status_code": log.status_code,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None
        }
        for log in logs
    ]
