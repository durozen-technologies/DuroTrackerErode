"""API tests: collection payments with opening-first + FIFO settlement."""

import pytest
from httpx import AsyncClient


async def _seed_stock(client: AsyncClient, supplier_id: str, item_id: str, qty: float = 500):
    await client.post(
        "/api/purchases/",
        json={
            "party_id": supplier_id,
            "cash_payment": 0,
            "upi_payment": 0,
            "items": [{"item_id": item_id, "quantity": qty, "rate": 1}],
        },
    )


@pytest.mark.api
@pytest.mark.asyncio
async def test_payment_reduces_opening_only(client: AsyncClient):
    customer = (
        await client.post(
            "/api/parties/",
            json={
                "name": "Open Cust",
                "mobile": "9111111111",
                "type": "CUSTOMER",
                "opening_balance": 1000,
            },
        )
    ).json()
    assert float(customer["unpaid_opening_balance"]) == 1000
    assert float(customer["current_balance"]) == 1000

    pay = await client.post(
        "/api/payments/",
        json={
            "party_id": customer["id"],
            "cash_amount": 400,
            "upi_amount": 0,
        },
    )
    assert pay.status_code == 201, pay.text
    body = pay.json()
    assert body["type"] == "received"
    assert float(body["opening_settled"]) == 400
    assert body["bill_allocations"] == []
    assert float(body["unpaid_opening_balance"]) == 600
    assert float(body["current_balance"]) == 600

    ledger = await client.get(f"/api/parties/{customer['id']}/ledger")
    assert ledger.status_code == 200
    led = ledger.json()
    assert float(led["unpaid_opening_balance"]) == 600
    assert float(led["total_due"]) == 600
    assert any(e["kind"] == "payment" and float(e["total_amount"]) == 400 for e in led["entries"])


@pytest.mark.api
@pytest.mark.asyncio
async def test_payment_fifo_cascade(client: AsyncClient):
    from tests.helpers import seed_parties_and_item_via_api

    supplier, customer, item = await seed_parties_and_item_via_api(client)
    # Give customer an opening balance via update
    updated = await client.put(
        f"/api/parties/{customer['id']}",
        json={"opening_balance": 500},
    )
    assert updated.status_code == 200
    assert float(updated.json()["unpaid_opening_balance"]) == 500

    await _seed_stock(client, supplier["id"], item["id"], 200)

    sale1 = await client.post(
        "/api/sales/",
        json={
            "party_id": customer["id"],
            "date": "2026-07-01",
            "cash_payment": 0,
            "upi_payment": 0,
            "items": [{"item_id": item["id"], "quantity": 10, "rate": 100}],
        },
    )
    assert sale1.status_code == 201, sale1.text
    sale1_id = sale1.json()["id"]
    assert float(sale1.json()["balance_amount"]) == 1000

    sale2 = await client.post(
        "/api/sales/",
        json={
            "party_id": customer["id"],
            "date": "2026-07-10",
            "cash_payment": 0,
            "upi_payment": 0,
            "items": [{"item_id": item["id"], "quantity": 10, "rate": 80}],
        },
    )
    assert sale2.status_code == 201, sale2.text
    sale2_id = sale2.json()["id"]
    assert float(sale2.json()["balance_amount"]) == 800

    # Total due = 500 opening + 1000 + 800 = 2300
    # Pay 1800 → opening 500, sale1 1000, sale2 300; sale2 left 500
    pay = await client.post(
        "/api/payments/",
        json={
            "party_id": customer["id"],
            "cash_amount": 1000,
            "upi_amount": 800,
            "date": "2026-07-20",
        },
    )
    assert pay.status_code == 201, pay.text
    body = pay.json()
    assert float(body["opening_settled"]) == 500
    assert float(body["total_amount"]) == 1800
    assert len(body["bill_allocations"]) == 2
    assert body["bill_allocations"][0]["bill_id"] == sale1_id
    assert float(body["bill_allocations"][0]["amount_applied"]) == 1000
    assert float(body["bill_allocations"][0]["balance_remaining"]) == 0
    assert body["bill_allocations"][1]["bill_id"] == sale2_id
    assert float(body["bill_allocations"][1]["amount_applied"]) == 300
    assert float(body["bill_allocations"][1]["balance_remaining"]) == 500
    assert float(body["unpaid_opening_balance"]) == 0
    assert float(body["current_balance"]) == 500

    sales = (await client.get("/api/sales/")).json()
    s1 = next(s for s in sales if s["id"] == sale1_id)
    s2 = next(s for s in sales if s["id"] == sale2_id)
    assert float(s1["balance_amount"]) == 0
    assert float(s2["balance_amount"]) == 500


@pytest.mark.api
@pytest.mark.asyncio
async def test_overpayment_blocked(client: AsyncClient):
    customer = (
        await client.post(
            "/api/parties/",
            json={
                "name": "Tiny Due",
                "mobile": "9222222222",
                "type": "CUSTOMER",
                "opening_balance": 100,
            },
        )
    ).json()

    bad = await client.post(
        "/api/payments/",
        json={"party_id": customer["id"], "cash_amount": 150, "upi_amount": 0},
    )
    assert bad.status_code == 400
    assert "exceeds" in bad.json()["detail"].lower()

    zero = await client.post(
        "/api/payments/",
        json={"party_id": customer["id"], "cash_amount": 0, "upi_amount": 0},
    )
    assert zero.status_code == 422


@pytest.mark.api
@pytest.mark.asyncio
async def test_supplier_payment_settles_purchases(client: AsyncClient):
    from tests.helpers import seed_parties_and_item_via_api

    supplier, _customer, item = await seed_parties_and_item_via_api(client)
    await client.put(
        f"/api/parties/{supplier['id']}",
        json={"opening_balance": 200},
    )

    purchase = await client.post(
        "/api/purchases/",
        json={
            "party_id": supplier["id"],
            "date": "2026-07-05",
            "cash_payment": 0,
            "upi_payment": 0,
            "items": [{"item_id": item["id"], "quantity": 10, "rate": 50}],
        },
    )
    assert purchase.status_code == 201, purchase.text
    purchase_id = purchase.json()["id"]
    assert float(purchase.json()["balance_amount"]) == 500

    # Due = 200 opening + 500 = 700; pay 700
    pay = await client.post(
        "/api/payments/",
        json={
            "party_id": supplier["id"],
            "cash_amount": 300,
            "upi_amount": 400,
        },
    )
    assert pay.status_code == 201, pay.text
    body = pay.json()
    assert body["type"] == "paid"
    assert float(body["opening_settled"]) == 200
    assert len(body["bill_allocations"]) == 1
    assert body["bill_allocations"][0]["bill_id"] == purchase_id
    assert body["bill_allocations"][0]["bill_type"] == "purchase"
    assert float(body["bill_allocations"][0]["balance_remaining"]) == 0
    assert float(body["current_balance"]) == 0
    assert float(body["unpaid_opening_balance"]) == 0
