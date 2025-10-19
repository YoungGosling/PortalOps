from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.crud import payment_info, audit_log
from app.core.deps import require_admin
from app.schemas.payment import PaymentRegisterItem, PaymentRegisterSummary, PaymentInfoUpdate
from app.models.user import User
import uuid
import os
import aiofiles
from decimal import Decimal
from datetime import date

router = APIRouter()


@router.get("", response_model=List[PaymentRegisterItem])
def read_payment_register(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieve all products with their payment info for the payment register.
    """
    return payment_info.get_payment_register(db)


@router.get("/summary", response_model=PaymentRegisterSummary)
def read_payment_register_summary(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get summary of incomplete payment info for navigation badge.
    """
    incomplete_count = payment_info.get_incomplete_count(db)
    return {"incompleteCount": incomplete_count}


@router.put("/{product_id}", status_code=204)
async def update_payment_info(
    product_id: uuid.UUID,
    amount: Optional[str] = Form(None),
    cardholder_name: Optional[str] = Form(None),
    expiry_date: Optional[str] = Form(None),
    payment_method: Optional[str] = Form(None),
    bill_attachment: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update payment information for a product with file upload support.
    """
    existing_payment_info = payment_info.get(db, product_id)
    update_data = {}

    # Handle file upload
    file_path = None
    if bill_attachment:
        # Create uploads directory if it doesn't exist
        upload_dir = "uploads/bill_attachments"
        os.makedirs(upload_dir, exist_ok=True)

        # Generate unique filename
        file_extension = os.path.splitext(bill_attachment.filename)[1]
        file_name = f"{product_id}{file_extension}"
        file_path = os.path.join(upload_dir, file_name)

        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await bill_attachment.read()
            await f.write(content)

        update_data['bill_attachment_path'] = file_path

    # Convert form data to proper types
    if amount is not None:
        update_data['amount'] = Decimal(amount)
    if cardholder_name is not None:
        update_data['cardholder_name'] = cardholder_name
    if expiry_date is not None:
        # Parse date string (expected format: YYYY-MM-DD)
        update_data['expiry_date'] = date.fromisoformat(expiry_date)
    if payment_method is not None:
        update_data['payment_method'] = payment_method

    if not existing_payment_info:
        # This case should be rare now, but handle it defensively
        from app.schemas.payment import PaymentInfoCreate
        payment_create = PaymentInfoCreate(
            product_id=product_id,
            **update_data
        )
        updated_obj = payment_info.create(db, obj_in=payment_create)
    else:
        updated_obj = payment_info.update(
            db, db_obj=existing_payment_info, obj_in=update_data)

    # Check for completeness
    if (
        updated_obj.amount is not None and
        updated_obj.cardholder_name and
        updated_obj.expiry_date and
        updated_obj.payment_method
    ):
        if updated_obj.status != 'complete':
            payment_info.update(db, db_obj=updated_obj,
                                obj_in={"status": "complete"})
    else:
        if updated_obj.status != 'incomplete':
            payment_info.update(db, db_obj=updated_obj, obj_in={
                                "status": "incomplete"})

    # Log the action
    try:
        json_serializable_details = {}
        for key, value in update_data.items():
            if value is None:
                json_serializable_details[key] = None
            elif hasattr(value, '__str__'):
                json_serializable_details[key] = str(value)
            else:
                json_serializable_details[key] = value

        audit_log.log_action(
            db,
            actor_user_id=current_user.id,
            action="payment_info.update",
            target_id=str(product_id),
            details=json_serializable_details
        )
    except Exception as e:
        print(f"Audit log error: {e}")
        # Don't fail the whole operation for audit log issues
