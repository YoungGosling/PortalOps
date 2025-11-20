from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.crud import payment_info, payment_invoice, audit_log
from app.core.deps import require_admin
from app.core.config import settings
from app.schemas.payment import PaymentRegisterItem
from app.schemas.payment_invoice import PaymentInvoiceResponse
from app.models.user import User
import uuid
import os
import aiofiles

router = APIRouter()

# Storage directory for invoice files (configured via environment variable)
STORAGE_DIR = settings.INVOICE_STORAGE_DIR
os.makedirs(STORAGE_DIR, exist_ok=True)


@router.get("")
def read_payment_register_v2(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=10000),
    search: str = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieve all payment records for all products for the payment register v2.
    Returns a flat list where each payment record is a separate item.
    Multiple payments for the same product will appear as multiple items.
    Supports pagination and search by product name.
    """
    # Get all payment records (one-to-many: multiple payments per product)
    skip = (page - 1) * limit
    payment_register_data, total = payment_info.get_payment_register(
        db, skip=skip, limit=limit, search=search)

    # Enhance each item with invoice information
    for item in payment_register_data:
        # Use payment ID instead of product ID
        payment_info_id = item["paymentId"]
        invoices = payment_invoice.get_by_payment_info_id(
            db, payment_info_id=uuid.UUID(payment_info_id))

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

    return {
        "data": payment_register_data,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit
        }
    }


@router.put("/payments/{payment_id}", status_code=204)
def update_payment_by_id_v2(
    payment_id: uuid.UUID,
    amount: float = Form(None),
    cardholder_name: str = Form(None),
    expiry_date: str = Form(None),
    payment_method_id: int = Form(None),
    currency_id: int = Form(None),
    payment_date: str = Form(None),
    usage_start_date: str = Form(None),
    usage_end_date: str = Form(None),
    reporter: str = Form(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update a specific payment record by payment ID.
    Supports one-to-many relationship where multiple payments can exist per product.
    """
    from datetime import date

    # Get the payment by payment ID
    existing_payment_info = payment_info.get(db, payment_id)

    if not existing_payment_info:
        raise HTTPException(
            status_code=404,
            detail=f"Payment record with ID {payment_id} not found"
        )

    update_data = {}

    # Convert form data to proper types
    if amount is not None:
        update_data['amount'] = float(amount)
    if cardholder_name is not None:
        update_data['cardholder_name'] = cardholder_name
    if expiry_date is not None:
        update_data['expiry_date'] = date.fromisoformat(expiry_date)
    if payment_method_id is not None:
        update_data['payment_method_id'] = payment_method_id
    if currency_id is not None:
        update_data['currency_id'] = currency_id
    if payment_date is not None:
        update_data['payment_date'] = date.fromisoformat(payment_date)
    if usage_start_date is not None:
        update_data['usage_start_date'] = date.fromisoformat(usage_start_date)
    if usage_end_date is not None:
        update_data['usage_end_date'] = date.fromisoformat(usage_end_date)
    if reporter is not None:
        update_data['reporter'] = reporter

    # Always update reporter to current user when payment info is updated
    if 'reporter' not in update_data:
        update_data['reporter'] = current_user.name

    updated_obj = payment_info.update(
        db, db_obj=existing_payment_info, obj_in=update_data)

    # Check for completeness - now includes invoice requirement
    # Note: expiry_date is optional (credit card expiry), not required for completeness
    product_id = existing_payment_info.product_id
    invoices = payment_invoice.get_by_product_id(db, product_id=product_id)
    has_invoices = len(invoices) > 0

    # Store old status for comparison
    old_status = updated_obj.status

    if (
        updated_obj.amount is not None and
        updated_obj.cardholder_name and
        updated_obj.payment_method_id and
        updated_obj.payment_date and
        updated_obj.usage_start_date and
        updated_obj.usage_end_date and
        updated_obj.reporter and
        has_invoices
    ):
        if updated_obj.status != 'complete':
            payment_info.update(db, db_obj=updated_obj,
                                obj_in={"status": "complete"})

            # If payment status changed from incomplete to complete, restore product status to Active
            if old_status == 'incomplete' and product_id:
                from app.models.payment import ProductStatus
                from app.models.service import Product

                active_status = db.query(ProductStatus).filter(
                    ProductStatus.name == 'Active'
                ).first()

                if active_status:
                    product = db.query(Product).filter(
                        Product.id == product_id).first()
                    if product and product.status_id != active_status.id:
                        # Only update to Active if current status is Overdue
                        overdue_status = db.query(ProductStatus).filter(
                            ProductStatus.name == 'Overdue'
                        ).first()

                        if overdue_status and product.status_id == overdue_status.id:
                            product.status_id = active_status.id
                            db.add(product)
                            db.commit()
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
            action="payment_info.update_by_id_v2",
            target_id=str(payment_id),
            details=json_serializable_details
        )
    except Exception as e:
        print(f"Audit log error: {e}")
        # Don't fail the whole operation for audit log issues


@router.put("/{product_id}", status_code=204)
def update_payment_info_v2(
    product_id: uuid.UUID,
    amount: str = Form(None),
    cardholder_name: str = Form(None),
    expiry_date: str = Form(None),
    payment_method_id: int = Form(None),
    payment_date: str = Form(None),
    usage_start_date: str = Form(None),
    usage_end_date: str = Form(None),
    reporter: str = Form(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update payment information for a product (updates the latest payment or creates new one).
    For backward compatibility. Use /payments/{payment_id} endpoint for specific payment updates.
    """
    from decimal import Decimal
    from datetime import date
    from app.schemas.payment import PaymentInfoCreate

    # Get the latest payment for this product
    existing_payment_info = payment_info.get_latest_by_product(db, product_id)
    update_data = {}

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
        payment_create = PaymentInfoCreate(
            product_id=product_id,
            payment_date=update_data.get('payment_date', date.today()),
            usage_start_date=update_data.get('usage_start_date', date.today()),
            usage_end_date=update_data.get('usage_end_date', date.today()),
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

    # Check for completeness - now includes invoice requirement
    # Note: expiry_date is optional (credit card expiry), not required for completeness
    invoices = payment_invoice.get_by_product_id(db, product_id=product_id)
    has_invoices = len(invoices) > 0

    # Store old status for comparison
    old_status = updated_obj.status

    if (
        updated_obj.amount is not None and
        updated_obj.cardholder_name and
        updated_obj.payment_method_id and
        updated_obj.payment_date and
        updated_obj.usage_start_date and
        updated_obj.usage_end_date and
        updated_obj.reporter and
        has_invoices
    ):
        if updated_obj.status != 'complete':
            payment_info.update(db, db_obj=updated_obj,
                                obj_in={"status": "complete"})

            # If payment status changed from incomplete to complete, restore product status to Active
            if old_status == 'incomplete':
                from app.models.payment import ProductStatus
                from app.models.service import Product

                active_status = db.query(ProductStatus).filter(
                    ProductStatus.name == 'Active'
                ).first()

                if active_status:
                    product = db.query(Product).filter(
                        Product.id == product_id).first()
                    if product and product.status_id != active_status.id:
                        # Only update to Active if current status is Overdue
                        overdue_status = db.query(ProductStatus).filter(
                            ProductStatus.name == 'Overdue'
                        ).first()

                        if overdue_status and product.status_id == overdue_status.id:
                            product.status_id = active_status.id
                            db.add(product)
                            db.commit()
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


@router.get("/products/{product_id}/payments")
def get_product_payments(
    product_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get all payment records for a specific product.
    Returns multiple payments for one-to-many relationship.
    """
    from app.models.payment import ProductStatus, PaymentMethod
    from app.models.service import Product, Service

    # Get all payments for this product
    payments = payment_info.get_by_product(db, product_id)

    # Get product details
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    service = db.query(Service).filter(
        Service.id == product.service_id).first()
    product_status = db.query(ProductStatus).filter(
        ProductStatus.id == product.status_id).first() if product.status_id else None

    result = []
    for payment in payments:
        # Get payment method name
        payment_method_name = None
        payment_method_description = None
        if payment.payment_method_id:
            payment_method = db.query(PaymentMethod).filter(
                PaymentMethod.id == payment.payment_method_id
            ).first()
            if payment_method:
                payment_method_name = payment_method.name
                payment_method_description = payment_method.description

        # Get currency information
        currency_code = None
        currency_symbol = None
        if payment.currency_id:
            from app.models.payment import Currency
            currency = db.query(Currency).filter(
                Currency.id == payment.currency_id
            ).first()
            if currency:
                currency_code = currency.code
                currency_symbol = currency.symbol

        # Get invoices for this specific payment record
        invoices = payment_invoice.get_by_payment_info_id(
            db, payment_info_id=payment.id)
        invoice_responses = []
        for invoice in invoices:
            invoice_responses.append({
                "id": str(invoice.id),
                "original_file_name": invoice.original_file_name,
                "url": f"/api/v2/invoices/{invoice.id}"
            })

        # Format dates
        formatted_expiry_date = payment.expiry_date.strftime(
            "%m/%d/%Y") if payment.expiry_date else None
        formatted_payment_date = payment.payment_date.strftime(
            "%m/%d/%Y") if payment.payment_date else None
        formatted_usage_start = payment.usage_start_date.strftime(
            "%m/%d/%Y") if payment.usage_start_date else None
        formatted_usage_end = payment.usage_end_date.strftime(
            "%m/%d/%Y") if payment.usage_end_date else None

        result.append({
            "paymentId": str(payment.id),
            "productId": str(product.id),
            "productName": product.name,
            "productDescription": product.description,
            "productStatus": product_status.name if product_status else None,
            "serviceName": service.name if service else None,
            "serviceVendor": service.vendor if service else None,
            "paymentInfo": {
                "id": str(payment.id),
                "status": payment.status,
                "amount": float(payment.amount) if payment.amount else None,
                "cardholderName": payment.cardholder_name,
                "expiryDate": formatted_expiry_date,
                "paymentMethod": payment_method_name,
                "paymentMethodId": payment.payment_method_id,
                "paymentMethodDescription": payment_method_description,
                "currencyId": payment.currency_id,
                "currencyCode": currency_code,
                "currencySymbol": currency_symbol,
                "paymentDate": formatted_payment_date,
                "usageStartDate": formatted_usage_start,
                "usageEndDate": formatted_usage_end,
                "reporter": payment.reporter,
                "invoices": invoice_responses,
                "createdAt": payment.created_at.isoformat() if payment.created_at else None,
                "updatedAt": payment.updated_at.isoformat() if payment.updated_at else None
            }
        })

    return result


@router.post("/products/{product_id}/payments", status_code=201)
def create_payment_for_product(
    product_id: uuid.UUID,
    amount: str = Form(None),
    cardholder_name: str = Form(None),
    expiry_date: str = Form(None),
    payment_method_id: int = Form(None),
    currency_id: int = Form(None),
    payment_date: str = Form(...),
    usage_start_date: str = Form(...),
    usage_end_date: str = Form(...),
    reporter: str = Form(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new payment record for an existing product.
    Supports one-to-many relationship where multiple payments can exist per product.
    """
    from decimal import Decimal
    from datetime import date
    from app.schemas.payment import PaymentInfoCreate
    from app.models.service import Product

    # Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Create new payment record
    payment_create = PaymentInfoCreate(
        product_id=product_id,
        payment_date=date.fromisoformat(payment_date),
        usage_start_date=date.fromisoformat(usage_start_date),
        usage_end_date=date.fromisoformat(usage_end_date),
        reporter=reporter if reporter else current_user.name,
        amount=Decimal(amount) if amount else None,
        cardholder_name=cardholder_name,
        expiry_date=date.fromisoformat(expiry_date) if expiry_date else None,
        payment_method_id=payment_method_id,
        currency_id=currency_id
    )

    new_payment = payment_info.create(db, obj_in=payment_create)

    # Check for completeness
    invoices = payment_invoice.get_by_product_id(db, product_id=product_id)
    has_invoices = len(invoices) > 0

    if (
        new_payment.amount is not None and
        new_payment.cardholder_name and
        new_payment.payment_method_id and
        new_payment.payment_date and
        new_payment.usage_start_date and
        new_payment.usage_end_date and
        new_payment.reporter and
        has_invoices
    ):
        payment_info.update(db, db_obj=new_payment,
                            obj_in={"status": "complete"})

    # Log the action
    try:
        audit_log.log_action(
            db,
            actor_user_id=current_user.id,
            action="payment_info.create",
            target_id=str(new_payment.id),
            details={
                "product_id": str(product_id),
                "product_name": product.name,
                "payment_date": payment_date,
                "usage_period": f"{usage_start_date} to {usage_end_date}"
            }
        )
    except Exception as e:
        print(f"Audit log error: {e}")

    return {
        "id": str(new_payment.id),
        "product_id": str(product_id),
        "status": new_payment.status,
        "message": "Payment record created successfully"
    }


@router.post("/{product_id}/invoices", response_model=List[PaymentInvoiceResponse])
async def upload_invoices(
    product_id: uuid.UUID,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Upload one or more invoice files for a specific product's payment record.
    Supports PDF, DOCX, XLSX, XLS, PPTX, TXT, CSV, JPG, JPEG, PNG formats.
    """
    if not files:
        raise HTTPException(
            status_code=400,
            detail="At least one file must be uploaded"
        )

    # Define allowed file extensions
    allowed_extensions = ['.pdf', '.docx', '.xlsx', '.xls',
                          '.pptx', '.txt', '.csv', '.jpg', '.jpeg', '.png']

    uploaded_invoices = []

    for file in files:
        if not file.filename:
            continue

        # Validate file extension
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"File type not supported for '{file.filename}'. Allowed formats: {', '.join(allowed_extensions)}"
            )

        # Generate unique filename
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
        existing_payment_info = payment_info.get_latest_by_product(
            db, product_id)
        if existing_payment_info:
            # Check for completeness - now includes invoice requirement
            invoices = payment_invoice.get_by_product_id(
                db, product_id=product_id)
            has_invoices = len(invoices) > 0

            # Store old status for comparison
            old_status = existing_payment_info.status

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
                    payment_info.update(db, db_obj=existing_payment_info,
                                        obj_in={"status": "complete"})

                    # If payment status changed from incomplete to complete, restore product status to Active
                    if old_status == 'incomplete':
                        from app.models.payment import ProductStatus
                        from app.models.service import Product

                        active_status = db.query(ProductStatus).filter(
                            ProductStatus.name == 'Active'
                        ).first()

                        if active_status:
                            product = db.query(Product).filter(
                                Product.id == product_id).first()
                            if product and product.status_id != active_status.id:
                                # Only update to Active if current status is Overdue
                                overdue_status = db.query(ProductStatus).filter(
                                    ProductStatus.name == 'Overdue'
                                ).first()

                                if overdue_status and product.status_id == overdue_status.id:
                                    product.status_id = active_status.id
                                    db.add(product)
                                    db.commit()
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


@router.delete("/payments/{payment_id}", status_code=204)
def delete_payment_by_id(
    payment_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a payment record by payment ID.
    Also deletes all associated invoice files and records.
    """
    # Check if payment exists
    payment = payment_info.get(db, id=payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    # Get associated invoices before deleting
    invoices = payment_invoice.get_by_payment_info_id(
        db, payment_info_id=payment_id)

    # Delete invoice files from storage and database
    for invoice in invoices:
        # Delete physical file
        if invoice.file_path and os.path.exists(invoice.file_path):
            try:
                os.remove(invoice.file_path)
            except Exception as e:
                print(
                    f"Failed to delete invoice file {invoice.file_path}: {e}")

        # Delete invoice record
        try:
            payment_invoice.remove(db, id=invoice.id)
        except Exception as e:
            print(f"Failed to delete invoice record {invoice.id}: {e}")

    # Delete the payment record
    payment_info.remove(db, id=payment_id)

    # Log the action
    try:
        audit_log.log_action(
            db,
            actor_user_id=current_user.id,
            action="payment_info.delete",
            target_id=str(payment_id),
            details={
                "product_id": str(payment.product_id),
                "invoices_deleted": len(invoices)
            }
        )
    except Exception as e:
        print(f"Audit log error: {e}")

    return None
