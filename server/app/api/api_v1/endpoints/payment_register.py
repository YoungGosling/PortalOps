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
    payment_method_id: Optional[int] = Form(None),
    payment_date: Optional[str] = Form(None),
    usage_start_date: Optional[str] = Form(None),
    usage_end_date: Optional[str] = Form(None),
    reporter: Optional[str] = Form(None),
    bill_attachment: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update payment information for a product with file upload support.
    Creates a new payment record or updates the latest one.
    """
    # Get the latest payment for this product
    existing_payment_info = payment_info.get_latest_by_product(db, product_id)
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
        update_data['expiry_date'] = date.fromisoformat(expiry_date)
    if payment_method_id is not None:
        update_data['payment_method_id'] = payment_method_id
    if payment_date is not None:
        update_data['payment_date'] = date.fromisoformat(payment_date)
    if usage_start_date is not None:
        update_data['usage_start_date'] = date.fromisoformat(usage_start_date)
    if usage_end_date is not None:
        update_data['usage_end_date'] = date.fromisoformat(usage_end_date)
    if reporter is not None:
        update_data['reporter'] = reporter

    if not existing_payment_info:
        # Create new payment info - require mandatory fields
        from app.schemas.payment import PaymentInfoCreate
        from datetime import date as date_today

        payment_create = PaymentInfoCreate(
            product_id=product_id,
            payment_date=update_data.get('payment_date', date_today.today()),
            usage_start_date=update_data.get(
                'usage_start_date', date_today.today()),
            usage_end_date=update_data.get(
                'usage_end_date', date_today.today()),
            reporter=update_data.get('reporter', current_user.name),
            amount=update_data.get('amount'),
            cardholder_name=update_data.get('cardholder_name'),
            expiry_date=update_data.get('expiry_date'),
            payment_method_id=update_data.get('payment_method_id')
        )
        updated_obj = payment_info.create(db, obj_in=payment_create)
    else:
        # Always update reporter to current user when payment info is updated
        # This ensures proper attribution of who made the changes
        if 'reporter' not in update_data:
            update_data['reporter'] = current_user.name
        updated_obj = payment_info.update(
            db, db_obj=existing_payment_info, obj_in=update_data)

    # Check for completeness
    # Note: expiry_date is optional (credit card expiry), not required for completeness
    if (
        updated_obj.amount is not None and
        updated_obj.cardholder_name and
        updated_obj.payment_method_id and
        updated_obj.payment_date and
        updated_obj.usage_start_date and
        updated_obj.usage_end_date and
        updated_obj.reporter
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
