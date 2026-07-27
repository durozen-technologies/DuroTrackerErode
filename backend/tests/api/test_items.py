"""API tests: items master via FastAPI client."""

import pytest
from httpx import AsyncClient


@pytest.mark.api
@pytest.mark.asyncio
async def test_create_and_update_item(client: AsyncClient):
    created = await client.post(
        "/api/items/",
        json={
            "name_ta": "முட்டை",
            "name_en": "Egg",
            "unit_type": "UNIT",
        },
    )
    assert created.status_code == 201, created.text
    item = created.json()
    assert item["unit_type"] == "UNIT"
    assert float(item["available_stock"]) == 0

    listed = await client.get("/api/items/")
    assert listed.status_code == 200
    assert any(i["id"] == item["id"] for i in listed.json())

    updated = await client.put(
        f"/api/items/{item['id']}",
        json={"name_en": "Eggs"},
    )
    assert updated.status_code == 200
    assert updated.json()["name_en"] == "Eggs"
