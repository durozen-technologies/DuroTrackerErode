from fastapi import APIRouter
from app.api.routes import parties, purchases, sales, dashboard, expenses, items, reports, payments, auth, backup

api_router = APIRouter()
api_router.include_router(parties.router, prefix="/parties", tags=["parties"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(purchases.router, prefix="/purchases", tags=["purchases"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["expenses"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(backup.router, prefix="/backup", tags=["backup"])
