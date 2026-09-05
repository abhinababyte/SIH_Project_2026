import uuid

from sqlalchemy.orm import Session

from app.models.report import Report
from app.schemas.report import ReportCreate


def list_reports(db: Session) -> list[Report]:
    return db.query(Report).order_by(Report.timestamp.desc()).all()


def create_report(db: Session, report: ReportCreate) -> Report:
    db_report = Report(
        id=str(uuid.uuid4()),
        report_type=report.report_type,
        description=report.description,
        location=report.location,
        reported_by=report.reported_by,
        status="new",
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report
