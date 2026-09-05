import uuid

from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.schemas.incident import IncidentCreate


def list_incidents(db: Session) -> list[Incident]:
    return db.query(Incident).all()


def create_incident(db: Session, incident: IncidentCreate) -> Incident:
    db_incident = Incident(
        id=str(uuid.uuid4()),
        title=incident.title,
        location=incident.location,
        priority=incident.priority,
        status="detected",
    )
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    return db_incident


def _set_status(db: Session, incident_id: str, status: str) -> Incident | None:
    db_incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not db_incident:
        return None

    db_incident.status = status
    db.commit()
    db.refresh(db_incident)
    return db_incident


def acknowledge_incident(db: Session, incident_id: str) -> Incident | None:
    return _set_status(db, incident_id, "acknowledged")


def start_evacuation(db: Session, incident_id: str) -> Incident | None:
    return _set_status(db, incident_id, "evacuating")


def complete_incident(db: Session, incident_id: str) -> Incident | None:
    return _set_status(db, incident_id, "completed")
