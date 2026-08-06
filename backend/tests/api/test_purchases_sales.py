"""API tests: purchases & sales via FastAPI client."""

import pytest
from httpx import AsyncClient

from tests.helpers import seed_parties_and_item_via_api


@pytest.mark.api
@pytest.mark.asyncio
async def test_purchase_sale_stock_and_oversell(client: AsyncClient):
    supplier, customer, item = await seed_parties_and_item_via_api(client)

    purchase = await client.post(
        "/api/purchases/",
        json={
            "party_id": supplier["id"],
            "cash_payment": 1000,
            "upi_payment": 0,
            "items": [{"item_id": item["id"], "quantity": 40, "count": 20, "rate": 100}],
        },
    )
    assert purchase.status_code == 201, purchase.text
    body = purchase.json()
    assert body["total_amount"] == 4000
    assert body["balance_amount"] == 3000
    assert body["party_name"] == "Farm A"

    # Wrong party type for purchase
    bad_party = await client.post(
        "/api/purchases/",
        json={
            "party_id": customer["id"],
            "cash_payment": 0,
            "upi_payment": 0,
            "items": [{"item_id": item["id"], "quantity": 1, "rate": 100}],
        },
    )
    assert bad_party.status_code == 422

    items = (await client.get("/api/items/")).json()
    chicken = next(i for i in items if i["id"] == item["id"])
    assert float(chicken["available_stock"]) == 40

    oversell = await client.post(
        "/api/sales/",
        json={
            "party_id": customer["id"],
            "cash_payment": 0,
            "upi_payment": 0,
            "items": [{"item_id": item["id"], "quantity": 50, "rate": 120}],
        },
    )
    assert oversell.status_code == 422

    sale = await client.post(
        "/api/sales/",
        json={
            "party_id": customer["id"],
            "cash_payment": 2000,
            "upi_payment": 1600,
            "items": [{"item_id": item["id"], "quantity": 30, "count": 15, "rate": 120}],
        },
    )
    assert sale.status_code == 201, sale.text
    assert sale.json()["total_amount"] == 3600
    assert sale.json()["balance_amount"] == 0

    items = (await client.get("/api/items/")).json()
    chicken = next(i for i in items if i["id"] == item["id"])
    assert float(chicken["available_stock"]) == 10
    assert float(chicken["used_stock"]) == 30

    # PUT updates purchase
    updated = await client.put(
        f"/api/purchases/{body['id']}",
        json={
            "party_id": supplier["id"],
            "cash_payment": 2000,
            "upi_payment": 0,
            "items": [{"item_id": item["id"], "quantity": 20, "rate": 100}],
        },
    )
    assert updated.status_code == 400, updated.text


@pytest.mark.api
@pytest.mark.asyncio
async def test_delete_sale_restores_stock(client: AsyncClient):
    supplier, customer, item = await seed_parties_and_item_via_api(client)
    await client.post(
        "/api/purchases/",
        json={
            "party_id": supplier["id"],
            "cash_payment": 0,
            "upi_payment": 0,
            "items": [{"item_id": item["id"], "quantity": 10, "rate": 50}],
        },
    )
    sale = await client.post(
        "/api/sales/",
        json={
            "party_id": customer["id"],
            "cash_payment": 0,
            "upi_payment": 0,
            "items": [{"item_id": item["id"], "quantity": 4, "rate": 80}],
        },
    )
    assert sale.status_code == 201
    sale_id = sale.json()["id"]

    deleted = await client.delete(f"/api/sales/{sale_id}")
    assert deleted.status_code == 204

    items = (await client.get("/api/items/")).json()
    chicken = next(i for i in items if i["id"] == item["id"])
    assert float(chicken["available_stock"]) == 10
    assert float(chicken["used_stock"]) == 0
