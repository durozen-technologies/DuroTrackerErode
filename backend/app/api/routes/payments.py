"""Standalone collection / payout payments with opening-balance-first + FIFO settlement."""

from datetime import date as datetime_date, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, UUID7, field_validator, model_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.models.enums import PartyType, TransactionType
from app.models.party import Party
from app.models.purchase import Purchase
from app.models.sale import Sale
from app.models.transaction import PaymentTransaction

router = APIRouter()

TWOPLACES = Decimal("0.01")


def _money(value) -> Decimal:
    return Decimal(str(value)).quantize(TWOPLACES, rounding=ROUND_HALF_UP)


class PaymentCreate(BaseModel):
    party_id: UUID7
    date: datetime_date = Field(default_factory=datetime_date.today)
    cash_amount: float = 0.0
    upi_amount: float = 0.0

    @field_validator("cash_amount", "upi_amount")
    @classmethod
    def non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Amount cannot be negative")
        return v

    @model_validator(mode="after")
    def require_positive_total(self):
        if _money(self.cash_amount) + _money(self.upi_amount) <= 0:
            raise ValueError("Payment total must be greater than zero")
        return self


class BillAllocation(BaseModel):
    bill_id: UUID7
    bill_type: Literal["sale", "purchase"]
    amount_applied: float
    balance_remaining: float


class PaymentResponse(BaseModel):
    id: UUID7
    party_id: UUID7
    date: datetime_date
    type: TransactionType
    cash_amount: float
    upi_amount: float
    total_amount: float
    opening_settled: float
    bill_allocations: List[BillAllocation]
    unpaid_opening_balance: float
    current_balance: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


@router.post("/", response_model=PaymentResponse, status_code=201)
async def record_payment(
    payload: PaymentCreate,
    db: AsyncSession = Depends(deps.get_db),
):
    result = await db.execute(select(Party).where(Party.id == payload.party_id))
    party = result.scalar_one_or_none()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")

    cash = _money(payload.cash_amount)
    upi = _money(payload.upi_amount)
    remaining = cash + upi

    is_customer = party.type == PartyType.CUSTOMER
    bill_model = Sale if is_customer else Purchase
    bill_type: Literal["sale", "purchase"] = "sale" if is_customer else "purchase"
    txn_type = TransactionType.RECEIVED if is_customer else TransactionType.PAID

    unpaid_bills = (
        await db.execute(
            select(bill_model)
            .where(
                bill_model.party_id == party.id,
                bill_model.balance_amount > 0,
            )
            .order_by(bill_model.date, bill_model.created_at)
        )
    ).scalars().all()

    unpaid_opening = _money(party.unpaid_opening_balance)
    bills_due = sum((_money(b.balance_amount) for b in unpaid_bills), Decimal("0.00"))
    total_due = unpaid_opening + bills_due

    if remaining > total_due:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Payment ₹{remaining} exceeds total balance due ₹{total_due}. "
                "Reduce Cash/UPI to match or below what the party owes."
            ),
        )

    # Step 2: Opening balance first
    opening_settled = min(remaining, unpaid_opening)
    unpaid_opening -= opening_settled
    remaining -= opening_settled
    party.unpaid_opening_balance = unpaid_opening

    # Step 3: FIFO bills
    # ponytail: no payment_allocations table — bill.balance_amount is mutated in place;
    # add an allocations table if edit/delete of collection payments or bill reversal
    # after settlement needs an audit trail.
    allocations: List[BillAllocation] = []
    for bill in unpaid_bills:
        if remaining <= 0:
            break
        bill_bal = _money(bill.balance_amount)
        applied = min(remaining, bill_bal)
        bill_bal -= applied
        remaining -= applied
        bill.balance_amount = bill_bal
        allocations.append(
            BillAllocation(
                bill_id=bill.id,
                bill_type=bill_type,
                amount_applied=float(applied),
                balance_remaining=float(bill_bal),
            )
        )

    total = cash + upi
    party.current_balance = _money(party.current_balance) - total

    txn = PaymentTransaction(
        party_id=party.id,
        date=payload.date,
        type=txn_type,
        cash_amount=cash,
        upi_amount=upi,
        total_amount=total,
    )
    db.add(txn)
    await db.commit()
    await db.refresh(txn)
    await db.refresh(party)

    return PaymentResponse(
        id=txn.id,
        party_id=txn.party_id,
        date=txn.date,
        type=txn.type,
        cash_amount=float(txn.cash_amount),
        upi_amount=float(txn.upi_amount),
        total_amount=float(txn.total_amount),
        opening_settled=float(opening_settled),
        bill_allocations=allocations,
        unpaid_opening_balance=float(party.unpaid_opening_balance),
        current_balance=float(party.current_balance),
        created_at=txn.created_at,
        updated_at=txn.updated_at,
    )
