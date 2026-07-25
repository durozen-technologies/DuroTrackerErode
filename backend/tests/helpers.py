"""Reusable seed helpers for API / integration tests."""

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import PartyType, UnitType
from app.models.item import Item
from app.models.party import Party


async def seed_parties_and_item_via_api(client: AsyncClient):
    supplier = (
        await client.post(
            "/api/parties/",
            json={
                "name": "Farm A",
                "mobile": "9000000001",
                "type": "SUPPLIER",
                "opening_balance": 0,
            },
        )
    ).json()
    customer = (
        await client.post(
            "/api/parties/",
            json={
                "name": "Shop B",
                "mobile": "9000000002",
                "type": "CUSTOMER",
                "company_name": "B Mart",
                "opening_balance": 0,
            },
        )
    ).json()
    item = (
        await client.post(
            "/api/items/",
            json={
                "name_ta": "கோழி",
                "name_en": "Chicken",
                "unit_type": "KG",
                "minimum_stock": 50,
            },
        )
    ).json()
    return supplier, customer, item


async def seed_item_db(
    db: AsyncSession,
    *,
    name_en: str = "Chicken",
    available: float = 0,
    used: float = 0,
    minimum: float = 50,
) -> Item:
    item = Item(
        name_ta="கோழி",
        name_en=name_en,
        unit_type=UnitType.KG,
        available_stock=available,
        used_stock=used,
        minimum_stock=minimum,
    )
    db.add(item)
    await db.flush()
    return item


async def seed_party_db(
    db: AsyncSession,
    *,
    name: str,
    party_type: PartyType,
    mobile: str = "9000000000",
) -> Party:
    party = Party(
        name=name,
        mobile=mobile,
        type=party_type,
        opening_balance=0,
        unpaid_opening_balance=0,
        current_balance=0,
        is_active=True,
    )
    db.add(party)
    await db.flush()
    return party
