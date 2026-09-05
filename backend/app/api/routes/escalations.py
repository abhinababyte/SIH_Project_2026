from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.escalation import EscalationCreate, EscalationResponse
from app.services import escalations as escalation_service
from app.ws.manager import manager

router = APIRouter(prefix="/api/escalations", tags=["escalations"])


@router.get("", response_model=list[EscalationResponse])
def get_escalations(db: Session = Depends(get_db)):
    return escalation_service.list_escalations(db)


@router.post("", response_model=EscalationResponse)
async def create_escalation(escalation: EscalationCreate, db: Session = Depends(get_db)):
    db_escalation = escalation_service.create_escalation(db, escalation)

    await manager.broadcast({
        "event": "ESCALATION_CREATED",
        "escalation": {
            "id": db_escalation.id,
            "resource_type": db_escalation.resource_type,
            "priority": db_escalation.priority,
            "location": db_escalation.location,
            "description": db_escalation.description,
            "status": db_escalation.status,
            "timestamp": str(db_escalation.timestamp),
        },
    })
    return db_escalation
