import uuid

from sqlalchemy.orm import Session

from app.models.escalation import Escalation
from app.schemas.escalation import EscalationCreate


def list_escalations(db: Session) -> list[Escalation]:
    return db.query(Escalation).order_by(Escalation.timestamp.desc()).all()


def create_escalation(db: Session, escalation: EscalationCreate) -> Escalation:
    db_escalation = Escalation(
        id=str(uuid.uuid4()),
        resource_type=escalation.resource_type,
        priority=escalation.priority,
        location=escalation.location,
        description=escalation.description,
        status="PENDING",
    )
    db.add(db_escalation)
    db.commit()
    db.refresh(db_escalation)
    return db_escalation
