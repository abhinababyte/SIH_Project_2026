from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.report import ReportCreate, ReportResponse
from app.services import reports as report_service
from app.ws.manager import manager

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("", response_model=list[ReportResponse])
def get_reports(db: Session = Depends(get_db)):
    return report_service.list_reports(db)


@router.post("", response_model=ReportResponse)
async def create_report(report: ReportCreate, db: Session = Depends(get_db)):
    db_report = report_service.create_report(db, report)

    await manager.broadcast({
        "event": "REPORT_CREATED",
        "report": {
            "id": db_report.id,
            "report_type": db_report.report_type,
            "description": db_report.description,
            "location": db_report.location,
            "status": db_report.status,
            "reported_by": db_report.reported_by,
            "timestamp": str(db_report.timestamp),
        },
    })
    return db_report
