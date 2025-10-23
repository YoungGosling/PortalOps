from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.crud import payment_invoice, payment_info, audit_log
from app.core.deps import require_admin
from app.schemas.payment_invoice import PaymentInvoiceResponse
from app.models.user import User
import uuid
import os
import aiofiles
from pathlib import Path

router = APIRouter()

# Storage directory for invoice files
STORAGE_DIR = "/home/evanzhang/EnterpriseProjects/PortalOpsStorage/bills"
os.makedirs(STORAGE_DIR, exist_ok=True)


@router.post("/payments/{payment_info_id}/invoices", response_model=List[PaymentInvoiceResponse])
async def upload_invoices(
    payment_info_id: uuid.UUID,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Upload one or more invoice files for a specific payment record.
    """
    if not files:
        raise HTTPException(
            status_code=400,
            detail="At least one file must be uploaded"
        )

    # Verify payment record exists
    payment_record = payment_info.get(db, payment_info_id)
    if not payment_record:
        raise HTTPException(
            status_code=404,
            detail="Payment record not found"
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
                payment_info_id=payment_info_id,
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

    # After successful uploads, update payment status based on completeness
    try:
        invoices = payment_invoice.get_by_payment_info_id(
            db, payment_info_id=payment_info_id)
        has_invoices = len(invoices) > 0

        if (
            payment_record.amount is not None and
            payment_record.cardholder_name and
            payment_record.payment_method_id and
            payment_record.payment_date and
            payment_record.usage_start_date and
            payment_record.usage_end_date and
            payment_record.reporter and
            has_invoices
        ):
            if payment_record.status != 'complete':
                payment_info.update(db, db_obj=payment_record, obj_in={
                                    "status": "complete"})
        else:
            if payment_record.status != 'incomplete':
                payment_info.update(db, db_obj=payment_record, obj_in={
                                    "status": "incomplete"})
    except Exception as e:
        print(f"Payment status update error after upload: {e}")

    # Log the action
    try:
        audit_log.log_action(
            db,
            actor_user_id=current_user.id,
            action="invoice.upload",
            target_id=str(payment_info_id),
            details={"files_uploaded": len(uploaded_invoices)}
        )
    except Exception as e:
        print(f"Audit log error: {e}")

    return uploaded_invoices


@router.get("/{invoice_id}")
async def get_invoice(
    invoice_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific invoice file for preview or download.
    """
    invoice = payment_invoice.get(db, invoice_id)
    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found"
        )

    if not os.path.exists(invoice.file_path):
        raise HTTPException(
            status_code=404,
            detail="Invoice file not found on disk"
        )

    # Determine content type based on file extension
    file_extension = os.path.splitext(invoice.file_path)[1].lower()
    media_type = "application/octet-stream"
    if file_extension == ".pdf":
        media_type = "application/pdf"
    elif file_extension in [".jpg", ".jpeg"]:
        media_type = "image/jpeg"
    elif file_extension == ".png":
        media_type = "image/png"

    return FileResponse(
        path=invoice.file_path,
        filename=invoice.original_file_name,
        media_type=media_type
    )


@router.delete("/{invoice_id}", status_code=204)
def delete_invoice(
    invoice_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a specific invoice file.
    """
    invoice = payment_invoice.get(db, invoice_id)
    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found"
        )

    # Delete file and database record
    success = payment_invoice.delete_with_file(db, db_obj=invoice)
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to delete invoice"
        )

    # Re-evaluate payment status after deletion
    try:
        payment_info_id = invoice.payment_info_id
        existing_payment_info = payment_info.get(db, payment_info_id)
        if existing_payment_info:
            invoices = payment_invoice.get_by_payment_info_id(
                db, payment_info_id=payment_info_id)
            has_invoices = len(invoices) > 0

            if (
                existing_payment_info.amount is not None and
                existing_payment_info.cardholder_name and
                existing_payment_info.payment_method_id and
                existing_payment_info.payment_date and
                existing_payment_info.usage_start_date and
                existing_payment_info.usage_end_date and
                existing_payment_info.reporter and
                has_invoices
            ):
                if existing_payment_info.status != 'complete':
                    payment_info.update(db, db_obj=existing_payment_info, obj_in={
                                        "status": "complete"})
            else:
                if existing_payment_info.status != 'incomplete':
                    payment_info.update(db, db_obj=existing_payment_info, obj_in={
                                        "status": "incomplete"})
    except Exception as e:
        print(f"Payment status update error after delete: {e}")

    # Log the action
    try:
        audit_log.log_action(
            db,
            actor_user_id=current_user.id,
            action="invoice.delete",
            target_id=str(invoice_id),
            details={"payment_info_id": str(invoice.payment_info_id)}
        )
    except Exception as e:
        print(f"Audit log error: {e}")
