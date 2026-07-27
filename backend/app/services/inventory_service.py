from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from fastapi import HTTPException

from app.models.item import Item
from app.models.purchase import PurchaseItem
from app.models.sale import SaleItem


class InventoryService:
    @staticmethod
    async def process_purchase_items(db: AsyncSession, items: List[PurchaseItem]):
        """Increases available_stock based on purchases."""
        for p_item in items:
            result = await db.execute(select(Item).where(Item.id == p_item.item_id))
            item = result.scalar_one_or_none()
            if not item:
                raise HTTPException(status_code=404, detail=f"Item {p_item.item_id} not found")
            item.available_stock = float(item.available_stock) + float(p_item.quantity)

    @staticmethod
    async def process_sale_items(db: AsyncSession, items: List[SaleItem]):
        """Decreases available_stock and increases used_stock. Rejects oversell."""
        # Aggregate quantities per item so multi-line same-item bills are checked correctly
        needed: dict = {}
        for s_item in items:
            key = s_item.item_id
            needed[key] = needed.get(key, 0.0) + float(s_item.quantity)

        for item_id, qty in needed.items():
            result = await db.execute(select(Item).where(Item.id == item_id))
            item = result.scalar_one_or_none()
            if not item:
                raise HTTPException(status_code=404, detail=f"Item {item_id} not found")
            available = float(item.available_stock)
            if qty > available:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "code": "INSUFFICIENT_STOCK",
                        "message": f"Insufficient stock for {item.name_en}",
                        "item_name": item.name_en,
                        "available": available,
                        "requested": qty,
                    },
                )

        for s_item in items:
            result = await db.execute(select(Item).where(Item.id == s_item.item_id))
            item = result.scalar_one()
            item.available_stock = float(item.available_stock) - float(s_item.quantity)
            item.used_stock = float(item.used_stock) + float(s_item.quantity)

    @staticmethod
    async def revert_purchase_items(db: AsyncSession, items: List[PurchaseItem]):
        for p_item in items:
            result = await db.execute(select(Item).where(Item.id == p_item.item_id))
            item = result.scalar_one_or_none()
            if item:
                item.available_stock = float(item.available_stock) - float(p_item.quantity)

    @staticmethod
    async def revert_sale_items(db: AsyncSession, items: List[SaleItem]):
        for s_item in items:
            result = await db.execute(select(Item).where(Item.id == s_item.item_id))
            item = result.scalar_one_or_none()
            if item:
                item.available_stock = float(item.available_stock) + float(s_item.quantity)
                item.used_stock = float(item.used_stock) - float(s_item.quantity)
