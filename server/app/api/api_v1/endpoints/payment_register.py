from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.crud import payment_info, audit_log
from app.core.deps import require_admin
from app.schemas.payment import PaymentRegisterItem, PaymentRegisterSummary, PaymentInfoUpdate
from app.models.user import User
import uuid

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
def update_payment_info(
    product_id: uuid.UUID,
    payment_update: PaymentInfoUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update payment information for a product.
    """
    existing_payment_info = payment_info.get(db, product_id)
    update_data = payment_update.dict(exclude_unset=True)

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
        # Convert details to JSON-serializable format
        details = payment_update.dict(exclude_unset=True)
        json_serializable_details = {}
        
        for key, value in details.items():
            if value is None:
                json_serializable_details[key] = None
            elif hasattr(value, '__str__'):
                # Convert Decimal, date, and other objects to string
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
