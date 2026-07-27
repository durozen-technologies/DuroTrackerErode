"""Unit tests: InventoryService (no HTTP)."""

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.purchase import PurchaseItem
from app.models.sale import SaleItem
from app.services.inventory_service import InventoryService
from tests.helpers import seed_item_db


@pytest.mark.unit
@pytest.mark.asyncio
async def test_process_purchase_increases_stock(db_session: AsyncSession):
    item = await seed_item_db(db_session, available=10)
    await db_session.commit()

    line = PurchaseItem(item_id=item.id, quantity=25, rate=100, amount=2500)
    await InventoryService.process_purchase_items(db_session, [line])
    await db_session.commit()
    await db_session.refresh(item)

    assert float(item.available_stock) == 35


@pytest.mark.unit
@pytest.mark.asyncio
async def test_process_sale_decreases_stock_and_raises_used(db_session: AsyncSession):
    item = await seed_item_db(db_session, available=40, used=0)
    await db_session.commit()

    line = SaleItem(item_id=item.id, quantity=15, rate=120, amount=1800)
    await InventoryService.process_sale_items(db_session, [line])
    await db_session.commit()
    await db_session.refresh(item)

    assert float(item.available_stock) == 25
    assert float(item.used_stock) == 15


@pytest.mark.unit
@pytest.mark.asyncio
async def test_process_sale_rejects_oversell(db_session: AsyncSession):
    item = await seed_item_db(db_session, available=10)
    await db_session.commit()

    line = SaleItem(item_id=item.id, quantity=11, rate=100, amount=1100)
    with pytest.raises(HTTPException) as exc:
        await InventoryService.process_sale_items(db_session, [line])

    assert exc.value.status_code == 422
    assert exc.value.detail["code"] == "INSUFFICIENT_STOCK"
    await db_session.refresh(item)
    assert float(item.available_stock) == 10


@pytest.mark.unit
@pytest.mark.asyncio
async def test_process_sale_aggregates_same_item_lines(db_session: AsyncSession):
    item = await seed_item_db(db_session, available=10)
    await db_session.commit()

    lines = [
        SaleItem(item_id=item.id, quantity=6, rate=100, amount=600),
        SaleItem(item_id=item.id, quantity=5, rate=100, amount=500),
    ]
    with pytest.raises(HTTPException) as exc:
        await InventoryService.process_sale_items(db_session, lines)

    assert exc.value.status_code == 422
    assert exc.value.detail["requested"] == 11


@pytest.mark.unit
@pytest.mark.asyncio
async def test_revert_purchase_and_sale(db_session: AsyncSession):
    item = await seed_item_db(db_session, available=50, used=20)
    await db_session.commit()

    p_line = PurchaseItem(item_id=item.id, quantity=10, rate=1, amount=10)
    await InventoryService.revert_purchase_items(db_session, [p_line])
    await db_session.flush()
    await db_session.refresh(item)
    assert float(item.available_stock) == 40

    s_line = SaleItem(item_id=item.id, quantity=5, rate=1, amount=5)
    await InventoryService.revert_sale_items(db_session, [s_line])
    await db_session.commit()
    await db_session.refresh(item)
    assert float(item.available_stock) == 45
    assert float(item.used_stock) == 15
