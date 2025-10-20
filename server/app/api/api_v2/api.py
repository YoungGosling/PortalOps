from fastapi import APIRouter
from app.api.api_v2.endpoints import payment_register, invoices, master_files

api_router = APIRouter()

api_router.include_router(payment_register.router,
                          prefix="/payment-register", tags=["payment-register-v2"])
api_router.include_router(
    invoices.router, prefix="/invoices", tags=["invoices"])
api_router.include_router(
    master_files.router, prefix="/master-files", tags=["master-files-v2"])
