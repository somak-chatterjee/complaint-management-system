from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.db_models import Complaint
from app.models.schemas import ComplaintRecord, ComplaintResponse

router = APIRouter(prefix="/complaints", tags=["complaints"])

# Maps camelCase Pydantic field names to snake_case DB column names
FIELD_MAP = {
    "complaintSource": "complaint_source",
    "customerName": "customer_name",
    "productName": "product_name",
    "productStrength": "product_strength",
    "batchNumber": "batch_number",
    "manufacturingDate": "manufacturing_date",
    "expiryDate": "expiry_date",
    "quantityAffected": "quantity_affected",
    "complaintType": "complaint_type",
    "complaintDate": "complaint_date",
    "complaintDescription": "complaint_description",
    "initialSeverity": "initial_severity",
    "priority": "priority",
    "status": "status",
}


def _to_response(complaint: Complaint) -> ComplaintResponse:
    """Converts a DB row (snake_case) back into the camelCase API shape."""
    data = {camel: getattr(complaint, snake) for camel, snake in FIELD_MAP.items()}
    data["id"] = complaint.id
    data["created_at"] = complaint.created_at
    data["updated_at"] = complaint.updated_at
    return ComplaintResponse(**data)


@router.post("", response_model=ComplaintResponse)
def save_complaint(payload: ComplaintRecord, db: Session = Depends(get_db)):
    db_complaint = Complaint(
        **{snake: getattr(payload, camel) for camel, snake in FIELD_MAP.items() if camel != "status"},
        status=payload.status,
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return _to_response(db_complaint)


@router.get("", response_model=List[ComplaintResponse])
def list_complaints(db: Session = Depends(get_db)):
    complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).all()
    return [_to_response(c) for c in complaints]


@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return _to_response(complaint)