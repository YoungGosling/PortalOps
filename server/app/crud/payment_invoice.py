from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.crud.base import CRUDBase
from app.models.payment_invoice import PaymentInvoice
from app.schemas.payment_invoice import PaymentInvoiceCreate, PaymentInvoiceUpdate
import uuid
import os


class CRUDPaymentInvoice(CRUDBase[PaymentInvoice, PaymentInvoiceCreate, PaymentInvoiceUpdate]):
    def get_by_product_id(self, db: Session, *, product_id: uuid.UUID) -> List[PaymentInvoice]:
        """Get all invoices for a specific product."""
        return db.query(PaymentInvoice).filter(PaymentInvoice.product_id == product_id).all()

    def get_invoices_for_master_files(self, db: Session, *, product_id: Optional[uuid.UUID] = None) -> List[dict]:
        """Get all invoices for master files view with product and service information."""
        from app.models.service import Product, Service

        query = db.query(
            PaymentInvoice,
            Product.name.label('product_name'),
            Service.name.label('service_name')
        ).join(
            Product, PaymentInvoice.product_id == Product.id
        ).join(
            Service, Product.service_id == Service.id
        )

        if product_id:
            query = query.filter(PaymentInvoice.product_id == product_id)

        results = query.order_by(PaymentInvoice.created_at.desc()).all()

        master_files = []
        for invoice, product_name, service_name in results:
            master_files.append({
                "id": invoice.id,
                "file_name": invoice.file_name,
                "original_file_name": invoice.original_file_name,
                "product_id": invoice.product_id,
                "product_name": product_name,
                "service_name": service_name,
                "created_at": invoice.created_at
            })

        return master_files

    def delete_with_file(self, db: Session, *, db_obj: PaymentInvoice) -> bool:
        """Delete invoice record and remove file from filesystem."""
        try:
            # Remove file from filesystem
            if os.path.exists(db_obj.file_path):
                os.remove(db_obj.file_path)

            # Delete database record
            db.delete(db_obj)
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            print(f"Error deleting invoice file: {e}")
            return False

    def create_with_file(self, db: Session, *, product_id: uuid.UUID, file_name: str,
                         original_file_name: str, file_path: str) -> PaymentInvoice:
        """Create invoice record with file information."""
        invoice_data = PaymentInvoiceCreate(
            product_id=product_id,
            file_name=file_name,
            original_file_name=original_file_name,
            file_path=file_path
        )
        return self.create(db, obj_in=invoice_data)


payment_invoice = CRUDPaymentInvoice(PaymentInvoice)
