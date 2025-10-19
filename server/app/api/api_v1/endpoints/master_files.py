from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.models.payment import PaymentInfo
import os

router = APIRouter()


@router.get("/attachments", response_model=List[dict])
def list_attachments(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List all bill attachments.
    Returns list of files with metadata.
    """
    # Query all payment info records that have attachments
    payment_records = db.query(PaymentInfo).filter(
        PaymentInfo.bill_attachment_path.isnot(None)
    ).all()

    attachments = []
    for record in payment_records:
        if record.bill_attachment_path and os.path.exists(record.bill_attachment_path):
            file_size = os.path.getsize(record.bill_attachment_path)
            file_name = os.path.basename(record.bill_attachment_path)

            attachments.append({
                "fileId": str(record.product_id),
                "fileName": file_name,
                "filePath": record.bill_attachment_path,
                "fileSize": file_size,
                "productId": str(record.product_id)
            })

    return attachments


@router.get("/attachments/{file_id}")
def download_attachment(
    file_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Download a specific bill attachment file.
    """
    # Get payment info by product_id (which is used as file_id)
    try:
        import uuid
        product_id = uuid.UUID(file_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file ID format"
        )

    payment_record = db.query(PaymentInfo).filter(
        PaymentInfo.product_id == product_id
    ).first()

    if not payment_record or not payment_record.bill_attachment_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    file_path = payment_record.bill_attachment_path

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on server"
        )

    return FileResponse(
        path=file_path,
        filename=os.path.basename(file_path),
        media_type='application/octet-stream'
    )
