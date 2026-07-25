"""API tests: expenses via FastAPI client."""

import pytest
from httpx import AsyncClient


@pytest.mark.api
@pytest.mark.asyncio
async def test_expense_category_and_entry(client: AsyncClient):
    cat = await client.post(
        "/api/expenses/categories",
        json={"name_ta": "டீசல்", "name_en": "Diesel", "sort_order": 1, "is_active": True},
    )
    assert cat.status_code == 201, cat.text
    category = cat.json()

    entry = await client.post(
        "/api/expenses/",
        json={
            "category_id": category["id"],
            "expense_name": "Diesel",
            "cash_amount": 200,
            "upi_amount": 300,
            "note": "Trip",
        },
    )
    assert entry.status_code == 201, entry.text
    body = entry.json()
    assert float(body["total_amount"]) == 500

    history = await client.get("/api/expenses/?limit=10")
    assert history.status_code == 200
    assert any(e["id"] == body["id"] for e in history.json())
