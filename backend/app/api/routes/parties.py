from pydantic import UUID7, ConfigDict, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Literal, Optional, Union
from pydantic import BaseModel
from datetime import date, datetime
from decimal import Decimal

from app.api import deps
from app.models.party import Party
from app.models.enums import PartyType, TransactionType
from app.models.purchase import Purchase
from app.models.sale import Sale
from app.models.transaction import PaymentTransaction

router = APIRouter()


class PartyBase(BaseModel):
    name: str
    mobile: str = Field(min_length=1)
    address: Optional[str] = None
    company_name: Optional[str] = None
    type: PartyType
    opening_balance: float = 0.0
    is_active: bool = True


class PartyCreate(PartyBase):
    pass


class PartyUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = Field(default=None, min_length=1)
    address: Optional[str] = None
    company_name: Optional[str] = None
    opening_balance: Optional[float] = None
    is_active: Optional[bool] = None


class PartyResponse(PartyBase):
    id: UUID7
    unpaid_opening_balance: float
    current_balance: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LedgerBillEntry(BaseModel):
    kind: Literal["bill"] = "bill"
    id: UUID7
    date: date
    total_amount: float
    cash_payment: float
    upi_payment: float
    balance_amount: float
    bill_type: Literal["sale", "purchase"]


class LedgerPaymentEntry(BaseModel):
    kind: Literal["payment"] = "payment"
    id: UUID7
    date: date
    type: TransactionType
    cash_amount: float
    upi_amount: float
    total_amount: float


class PartyLedgerResponse(BaseModel):
    party_id: UUID7
    name: str
    type: PartyType
    opening_balance: float
    unpaid_opening_balance: float
    current_balance: float
    bills_due: float
    total_due: float
    entries: List[Union[LedgerBillEntry, LedgerPaymentEntry]]


@router.get("/", response_model=List[PartyResponse])
async def get_parties(
    party_type: Optional[PartyType] = None,
    active_only: bool = True,
    db: AsyncSession = Depends(deps.get_db),
):
    query = select(Party)
    if party_type:
        query = query.where(Party.type == party_type)
    if active_only:
        query = query.where(Party.is_active.is_(True))
    result = await db.execute(query.order_by(Party.name))
    return result.scalars().all()


@router.post("/", response_model=PartyResponse, status_code=201)
async def create_party(party: PartyCreate, db: AsyncSession = Depends(deps.get_db)):
    db_party = Party(
        name=party.name,
        mobile=party.mobile,
        address=party.address,
        company_name=party.company_name,
        type=party.type,
        opening_balance=party.opening_balance,
        unpaid_opening_balance=party.opening_balance,
        current_balance=party.opening_balance,
        is_active=party.is_active,
    )
    db.add(db_party)
    await db.commit()
    await db.refresh(db_party)
    return db_party


@router.put("/{party_id}", response_model=PartyResponse)
async def update_party(
    party_id: UUID7,
    party_update: PartyUpdate,
    db: AsyncSession = Depends(deps.get_db),
):
    result = await db.execute(select(Party).where(Party.id == party_id))
    db_party = result.scalar_one_or_none()
    if not db_party:
        raise HTTPException(status_code=404, detail="Party not found")

    data = party_update.model_dump(exclude_unset=True)
    if "opening_balance" in data:
        delta = float(data["opening_balance"]) - float(db_party.opening_balance)
        db_party.current_balance = float(db_party.current_balance) + delta
        db_party.unpaid_opening_balance = max(
            0.0, float(db_party.unpaid_opening_balance) + delta
        )

    for key, value in data.items():
        setattr(db_party, key, value)

    await db.commit()
    await db.refresh(db_party)
    return db_party


@router.get("/{party_id}/ledger", response_model=PartyLedgerResponse)
async def get_party_ledger(
    party_id: UUID7,
    db: AsyncSession = Depends(deps.get_db),
):
    result = await db.execute(select(Party).where(Party.id == party_id))
    party = result.scalar_one_or_none()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")

    entries: List[Union[LedgerBillEntry, LedgerPaymentEntry]] = []
    bills_due = Decimal("0")

    if party.type == PartyType.CUSTOMER:
        bills = (
            await db.execute(
                select(Sale)
                .where(Sale.party_id == party_id)
                .order_by(Sale.date, Sale.created_at)
            )
        ).scalars().all()
        for bill in bills:
            bal = Decimal(str(bill.balance_amount))
            bills_due += bal
            entries.append(
                LedgerBillEntry(
                    id=bill.id,
                    date=bill.date,
                    total_amount=float(bill.total_amount),
                    cash_payment=float(bill.cash_payment),
                    upi_payment=float(bill.upi_payment),
                    balance_amount=float(bal),
                    bill_type="sale",
                )
            )
    else:
        bills = (
            await db.execute(
                select(Purchase)
                .where(Purchase.party_id == party_id)
                .order_by(Purchase.date, Purchase.created_at)
            )
        ).scalars().all()
        for bill in bills:
            bal = Decimal(str(bill.balance_amount))
            bills_due += bal
            entries.append(
                LedgerBillEntry(
                    id=bill.id,
                    date=bill.date,
                    total_amount=float(bill.total_amount),
                    cash_payment=float(bill.cash_payment),
                    upi_payment=float(bill.upi_payment),
                    balance_amount=float(bal),
                    bill_type="purchase",
                )
            )

    txns = (
        await db.execute(
            select(PaymentTransaction)
            .where(PaymentTransaction.party_id == party_id)
            .order_by(PaymentTransaction.date, PaymentTransaction.created_at)
        )
    ).scalars().all()
    for txn in txns:
        entries.append(
            LedgerPaymentEntry(
                id=txn.id,
                date=txn.date,
                type=txn.type,
                cash_amount=float(txn.cash_amount),
                upi_amount=float(txn.upi_amount),
                total_amount=float(txn.total_amount),
            )
        )

    entries.sort(key=lambda e: (e.date, 0 if e.kind == "bill" else 1, str(e.id)))

    unpaid_opening = Decimal(str(party.unpaid_opening_balance))
    return PartyLedgerResponse(
        party_id=party.id,
        name=party.name,
        type=party.type,
        opening_balance=float(party.opening_balance),
        unpaid_opening_balance=float(unpaid_opening),
        current_balance=float(party.current_balance),
        bills_due=float(bills_due),
        total_due=float(unpaid_opening + bills_due),
        entries=entries,
    )
