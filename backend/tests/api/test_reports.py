"""API tests: reports + dashboard via FastAPI client."""

import pytest
from httpx import AsyncClient

from tests.helpers import seed_parties_and_item_via_api


@pytest.mark.api
@pytest.mark.asyncio
async def test_reports_and_dashboard(client: AsyncClient):
    supplier, customer, item = await seed_parties_and_item_via_api(client)
    await client.post(
        "/api/purchases/",
        json={
            "party_id": supplier["id"],
            "cash_payment": 500,
            "upi_payment": 0,
            "items": [{"item_id": item["id"], "quantity": 20, "rate": 100}],
        },
    )
    await client.post(
        "/api/sales/",
        json={
            "party_id": customer["id"],
            "cash_payment": 500,
            "upi_payment": 0,
            "items": [{"item_id": item["id"], "quantity": 5, "rate": 150}],
        },
    )

    purchases_report = await client.get("/api/reports/purchases?group_by=item")
    assert purchases_report.status_code == 200
    assert purchases_report.json()["total_quantity"] == 20

    sales_report = await client.get("/api/reports/sales?group_by=party")
    assert sales_report.status_code == 200
    assert sales_report.json()["total_amount"] == 750

    by_date = await client.get("/api/reports/purchases?group_by=date")
    assert by_date.status_code == 200
    assert len(by_date.json()["rows"]) >= 1

    inventory = await client.get("/api/reports/inventory")
    assert inventory.status_code == 200
    row = next(r for r in inventory.json() if r["name_en"] == "Chicken")
    assert row["purchased_quantity"] == 20
    assert row["sold_quantity"] == 5
    assert row["available_stock"] == 15

    outstanding = await client.get("/api/reports/outstanding?party_type=SUPPLIER")
    assert outstanding.status_code == 200
    assert any(r["name"] == "Farm A" for r in outstanding.json())

    expenses_report = await client.get("/api/reports/expenses?group_by=date")
    assert expenses_report.status_code == 200

    dash = await client.get("/api/dashboard/stats")
    assert dash.status_code == 200
    data = dash.json()
    assert data["total_purchases"] == 2000
    assert data["total_sales"] == 750
    assert "date_from" in data and "date_to" in data
