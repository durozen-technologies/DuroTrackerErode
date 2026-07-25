from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date
from pydantic import BaseModel

from app.api import deps
from app.models.purchase import Purchase
from app.models.sale import Sale
from app.models.expense import Expense
from app.models.item import Item
from app.models.party import Party
from app.models.enums import PartyType
from app.services.inventory_service import InventoryService
from app.schemas import LowStockAlert

router = APIRouter()


class InventoryStat(BaseModel):
    item_name: str
    available_stock: float
    used_stock: float


class DashboardStats(BaseModel):
    total_sales: float
    total_purchases: float
    total_expenses: float
    net_profit: float
    customer_outstanding: float
    supplier_outstanding: float
    inventory: List[InventoryStat]
    low_stock_alerts: List[LowStockAlert]
    date_from: date
    date_to: date


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: AsyncSession = Depends(deps.get_db),
):
    today = date.today()
    d_from = date_from or today
    d_to = date_to or today

    sales_total = float(
        (
            await db.execute(
                select(func.coalesce(func.sum(Sale.total_amount), 0)).where(
                    Sale.date >= d_from, Sale.date <= d_to
                )
            )
        ).scalar()
        or 0
    )
    purchases_total = float(
        (
            await db.execute(
                select(func.coalesce(func.sum(Purchase.total_amount), 0)).where(
                    Purchase.date >= d_from, Purchase.date <= d_to
                )
            )
        ).scalar()
        or 0
    )
    expenses_total = float(
        (
            await db.execute(
                select(func.coalesce(func.sum(Expense.total_amount), 0)).where(
                    cast(Expense.spent_at, Date) >= d_from,
                    cast(Expense.spent_at, Date) <= d_to,
                )
            )
        ).scalar()
        or 0
    )

    customer_outstanding = float(
        (
            await db.execute(
                select(func.coalesce(func.sum(Party.current_balance), 0)).where(
                    Party.type == PartyType.CUSTOMER
                )
            )
        ).scalar()
        or 0
    )
    supplier_outstanding = float(
        (
            await db.execute(
                select(func.coalesce(func.sum(Party.current_balance), 0)).where(
                    Party.type == PartyType.SUPPLIER
                )
            )
        ).scalar()
        or 0
    )

    items = (await db.execute(select(Item).order_by(Item.name_en))).scalars().all()
    inventory = [
        InventoryStat(
            item_name=item.name_en,
            available_stock=float(item.available_stock),
            used_stock=float(item.used_stock),
        )
        for item in items
    ]
    alerts_raw = await InventoryService.get_low_stock_alerts(db)
    low_stock_alerts = [LowStockAlert(**a) for a in alerts_raw]

    return DashboardStats(
        total_sales=sales_total,
        total_purchases=purchases_total,
        total_expenses=expenses_total,
        net_profit=sales_total - purchases_total - expenses_total,
        customer_outstanding=customer_outstanding,
        supplier_outstanding=supplier_outstanding,
        inventory=inventory,
        low_stock_alerts=low_stock_alerts,
        date_from=d_from,
        date_to=d_to,
    )
