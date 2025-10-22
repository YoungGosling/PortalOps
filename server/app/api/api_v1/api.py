from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, users, services, payment_register, workflows, audit_logs, products, master_files, dashboard, departments

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(
    dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(
    services.router, prefix="/services", tags=["services"])
api_router.include_router(
    products.router, prefix="/products", tags=["products"])
api_router.include_router(payment_register.router,
                          prefix="/payment-register", tags=["payment-register"])
api_router.include_router(
    workflows.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(workflows.inbox_router,
                          prefix="/inbox", tags=["inbox"])
api_router.include_router(
    audit_logs.router, prefix="/audit-logs", tags=["audit-logs"])
api_router.include_router(
    master_files.router, prefix="/master-files", tags=["master-files"])
api_router.include_router(
    departments.router, prefix="/departments", tags=["departments"])
