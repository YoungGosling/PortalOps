from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.crud import payment_info, payment_invoice, audit_log
from app.core.deps import require_admin
from app.schemas.payment import PaymentRegisterItem
from app.schemas.payment_invoice import PaymentInvoiceResponse
from app.models.user import User
import uuid
import os
import aiofiles

router = APIRouter()

# Storage directory for invoice files
STORAGE_DIR = "/home/evanzhang/EnterpriseProjects/PortalOpsStorage/bills"
os.makedirs(STORAGE_DIR, exist_ok=True)


@router.get("", response_model=List[PaymentRegisterItem])
def read_payment_register_v2(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieve all products with their payment info and invoices for the payment register v2.
    """
    # Get the base payment register data
    payment_register_data = payment_info.get_payment_register(db)

    # Enhance each item with invoice information
    for item in payment_register_data:
        product_id = item["productId"]
        invoices = payment_invoice.get_by_product_id(db, product_id=product_id)

        # Convert invoices to response format
        invoice_responses = []
        for invoice in invoices:
            invoice_responses.append({
                "id": str(invoice.id),
                "original_file_name": invoice.original_file_name,
                "url": f"/api/v2/invoices/{invoice.id}"
            })

        # Add invoices to payment info
        item["paymentInfo"]["invoices"] = invoice_responses

    return payment_register_data


@router.put("/{product_id}", status_code=204)
def update_payment_info_v2(
    product_id: uuid.UUID,
    amount: str = Form(None),
    cardholder_name: str = Form(None),
    expiry_date: str = Form(None),
    payment_method: str = Form(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update payment information for a product (core fields only).
    Invoice management is handled by separate endpoints.
    """
    from decimal import Decimal
    from datetime import date
    from app.schemas.payment import PaymentInfoCreate

    existing_payment_info = payment_info.get(db, product_id)
    update_data = {}

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
        # Create new payment info
        payment_create = PaymentInfoCreate(
            product_id=product_id,
            **update_data
        )
        updated_obj = payment_info.create(db, obj_in=payment_create)
    else:
        updated_obj = payment_info.update(
            db, db_obj=existing_payment_info, obj_in=update_data)

    # Check for completeness - now includes invoice requirement
    invoices = payment_invoice.get_by_product_id(db, product_id=product_id)
    has_invoices = len(invoices) > 0

    if (
        updated_obj.amount is not None and
        updated_obj.cardholder_name and
        updated_obj.expiry_date and
        updated_obj.payment_method and
        has_invoices
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
            action="payment_info.update_v2",
            target_id=str(product_id),
            details=json_serializable_details
        )
    except Exception as e:
        print(f"Audit log error: {e}")
        # Don't fail the whole operation for audit log issues


@router.post("/{product_id}/invoices", response_model=List[PaymentInvoiceResponse])
async def upload_invoices(
    product_id: uuid.UUID,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Upload one or more invoice files for a specific product's payment record.
    """
    if not files:
        raise HTTPException(
            status_code=400,
            detail="At least one file must be uploaded"
        )

    uploaded_invoices = []

    for file in files:
        if not file.filename:
            continue

        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(STORAGE_DIR, unique_filename)

        # Save file
        try:
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save file: {str(e)}"
            )

        # Create database record
        try:
            invoice = payment_invoice.create_with_file(
                db,
                product_id=product_id,
                file_name=unique_filename,
                original_file_name=file.filename,
                file_path=file_path
            )

            uploaded_invoices.append(PaymentInvoiceResponse(
                id=invoice.id,
                original_file_name=invoice.original_file_name,
                url=f"/api/v2/invoices/{invoice.id}"
            ))

        except Exception as e:
            # Clean up file if database operation fails
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create invoice record: {str(e)}"
            )

    # Update payment status after invoice upload
    try:
        existing_payment_info = payment_info.get(db, product_id)
        if existing_payment_info:
            # Check for completeness - now includes invoice requirement
            invoices = payment_invoice.get_by_product_id(
                db, product_id=product_id)
            has_invoices = len(invoices) > 0

            if (
                existing_payment_info.amount is not None and
                existing_payment_info.cardholder_name and
                existing_payment_info.expiry_date and
                existing_payment_info.payment_method and
                has_invoices
            ):
                if existing_payment_info.status != 'complete':
                    payment_info.update(db, db_obj=existing_payment_info,
                                        obj_in={"status": "complete"})
            else:
                if existing_payment_info.status != 'incomplete':
                    payment_info.update(db, db_obj=existing_payment_info, obj_in={
                        "status": "incomplete"})
    except Exception as e:
        print(f"Payment status update error: {e}")
        # Don't fail the whole operation for status update issues

    # Log the action
    try:
        audit_log.log_action(
            db,
            actor_user_id=current_user.id,
            action="invoice.upload",
            target_id=str(product_id),
            details={"files_uploaded": len(uploaded_invoices)}
        )
    except Exception as e:
        print(f"Audit log error: {e}")

    return uploaded_invoices
