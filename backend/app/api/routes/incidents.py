from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.incident import IncidentCreate, IncidentResponse
from app.services import incidents as incident_service
from app.ws.manager import manager

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


@router.get("", response_model=list[IncidentResponse])
def get_incidents(db: Session = Depends(get_db)):
    return incident_service.list_incidents(db)


@router.post("/escalate", response_model=IncidentResponse)
async def escalate_incident(incident: IncidentCreate, db: Session = Depends(get_db)):
    db_incident = incident_service.create_incident(db, incident)

    await manager.broadcast({
        "event": "INCIDENT_ESCALATED",
        "incident": {
            "id": db_incident.id,
            "title": db_incident.title,
            "location": db_incident.location,
            "priority": db_incident.priority,
            "status": db_incident.status,
            "timestamp": str(db_incident.timestamp),
        },
    })
    return db_incident


@router.post("/{incident_id}/acknowledge")
async def acknowledge_incident(incident_id: str, db: Session = Depends(get_db)):
    db_incident = incident_service.acknowledge_incident(db, incident_id)
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    await manager.broadcast({
        "event": "INCIDENT_ACKNOWLEDGED",
        "incident_id": incident_id,
    })
    return {"status": "success", "incident_id": incident_id}
