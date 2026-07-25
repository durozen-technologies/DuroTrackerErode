"""API tests: parties CRUD via FastAPI client."""

import pytest
from httpx import AsyncClient


@pytest.mark.api
@pytest.mark.asyncio
async def test_create_and_list_parties(client: AsyncClient):
    missing_mobile = await client.post(
        "/api/parties/",
        json={"name": "No Phone", "type": "SUPPLIER", "opening_balance": 0},
    )
    assert missing_mobile.status_code == 422

    created = await client.post(
        "/api/parties/",
        json={
            "name": "Purchaser One",
            "mobile": "9876543210",
            "type": "SUPPLIER",
            "company_name": "One Farms",
            "opening_balance": 100,
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["name"] == "Purchaser One"
    assert body["company_name"] == "One Farms"
    assert float(body["current_balance"]) == 100
    assert body["is_active"] is True

    listed = await client.get("/api/parties/?party_type=SUPPLIER")
    assert listed.status_code == 200
    assert any(p["id"] == body["id"] for p in listed.json())

    updated = await client.put(
        f"/api/parties/{body['id']}",
        json={"name": "Purchaser Renamed", "is_active": False},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Purchaser Renamed"

    active_only = await client.get("/api/parties/?party_type=SUPPLIER&active_only=true")
    assert all(p["id"] != body["id"] for p in active_only.json())
