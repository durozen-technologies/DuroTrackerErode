"""API tests: items master via FastAPI client."""

import pytest
from httpx import AsyncClient


@pytest.mark.api
@pytest.mark.asyncio
async def test_create_update_and_low_stock_filter(client: AsyncClient):
    created = await client.post(
        "/api/items/",
        json={
            "name_ta": "முட்டை",
            "name_en": "Egg",
            "unit_type": "UNIT",
            "minimum_stock": 100,
        },
    )
    assert created.status_code == 201, created.text
    item = created.json()
    assert item["unit_type"] == "UNIT"
    assert float(item["available_stock"]) == 0

    # 0 available <= 100 minimum → low stock
    low = await client.get("/api/items/?low_stock=true")
    assert low.status_code == 200
    assert any(i["id"] == item["id"] for i in low.json())

    updated = await client.put(
        f"/api/items/{item['id']}",
        json={"minimum_stock": 0, "name_en": "Eggs"},
    )
    assert updated.status_code == 200
    assert updated.json()["name_en"] == "Eggs"
    assert float(updated.json()["minimum_stock"]) == 0
