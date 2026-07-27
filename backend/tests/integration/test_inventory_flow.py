"""Integration tests: inventory + party balances via ORM (no HTTP)."""

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import PartyType
from app.models.item import Item
from app.models.party import Party
from app.models.purchase import Purchase, PurchaseItem
from app.models.sale import Sale, SaleItem
from app.services.inventory_service import InventoryService
from tests.helpers import seed_item_db, seed_party_db


@pytest.mark.integration
@pytest.mark.asyncio
async def test_purchase_then_sale_updates_stock_and_balances(db_session: AsyncSession):
    supplier = await seed_party_db(db_session, name="Farm", party_type=PartyType.SUPPLIER, mobile="9111111111")
    customer = await seed_party_db(db_session, name="Shop", party_type=PartyType.CUSTOMER, mobile="9222222222")
    item = await seed_item_db(db_session, available=0)
    await db_session.flush()

    purchase = Purchase(
        party_id=supplier.id,
        date=__import__("datetime").date.today(),
        total_amount=2000,
        cash_payment=500,
        upi_payment=0,
        balance_amount=1500,
    )
    db_session.add(purchase)
    await db_session.flush()

    p_item = PurchaseItem(
        purchase_id=purchase.id,
        item_id=item.id,
        quantity=20,
        rate=100,
        amount=2000,
    )
    db_session.add(p_item)
    await db_session.flush()
    await InventoryService.process_purchase_items(db_session, [p_item])
    supplier.current_balance = float(supplier.current_balance) + 2000 - 500
    await db_session.commit()

    await db_session.refresh(item)
    await db_session.refresh(supplier)
    assert float(item.available_stock) == 20
    assert float(supplier.current_balance) == 1500

    sale = Sale(
        party_id=customer.id,
        date=__import__("datetime").date.today(),
        total_amount=900,
        cash_payment=900,
        upi_payment=0,
        balance_amount=0,
    )
    db_session.add(sale)
    await db_session.flush()
    s_item = SaleItem(
        sale_id=sale.id,
        item_id=item.id,
        quantity=5,
        rate=180,
        amount=900,
    )
    db_session.add(s_item)
    await db_session.flush()
    await InventoryService.process_sale_items(db_session, [s_item])
    customer.current_balance = float(customer.current_balance) + 900 - 900
    await db_session.commit()

    await db_session.refresh(item)
    await db_session.refresh(customer)
    assert float(item.available_stock) == 15
    assert float(item.used_stock) == 5
    assert float(customer.current_balance) == 0

    # Persistence check via fresh query
    stored = (
        await db_session.execute(select(Item).where(Item.id == item.id))
    ).scalar_one()
    assert float(stored.available_stock) == 15

    parties = (await db_session.execute(select(Party))).scalars().all()
    assert len(parties) == 2
