from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.crud import payment_invoice
from app.core.deps import require_admin
from app.schemas.payment_invoice import MasterFileInvoice
from app.models.user import User
import uuid

router = APIRouter()


@router.get("/invoices", response_model=List[MasterFileInvoice])
def get_master_files_invoices(
    product_id: Optional[uuid.UUID] = Query(
        None, description="Filter by product ID"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieve a list of all invoice records for the Master Files view.
    """
    invoices_data = payment_invoice.get_invoices_for_master_files(
        db, product_id=product_id
    )

    return [
        MasterFileInvoice(
            id=invoice["id"],
            file_name=invoice["file_name"],
            original_file_name=invoice["original_file_name"],
            product_id=invoice["product_id"],
            product_name=invoice["product_name"],
            service_name=invoice["service_name"],
            created_at=invoice["created_at"]
        )
        for invoice in invoices_data
    ]
