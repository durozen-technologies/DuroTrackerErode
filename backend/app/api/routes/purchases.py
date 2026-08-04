from pydantic import UUID7, ConfigDict, BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, date as datetime_date

from app.api import deps
from app.models.purchase import Purchase, PurchaseItem
from app.models.party import Party
from app.models.item import Item
from app.models.transaction import PaymentTransaction
from app.models.enums import TransactionType, PartyType
from app.services.inventory_service import InventoryService

router = APIRouter()


class PurchaseItemCreate(BaseModel):
    item_id: UUID7
    quantity: float = Field(gt=0)
    count: Optional[int] = None
    rate: float = Field(ge=0)
    amount: Optional[float] = None  # ignored; server recomputes


class PurchaseItemResponse(BaseModel):
    id: UUID7
    item_id: UUID7
    quantity: float
    count: Optional[int] = None
    rate: float
    amount: float
    item_name_en: Optional[str] = None
    item_name_ta: Optional[str] = None
    unit_type: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PurchaseCreate(BaseModel):
    party_id: UUID7
    date: Optional[datetime_date] = None
    cash_payment: float = 0.0
    upi_payment: float = 0.0
    driver_name: Optional[str] = None
    vehicle_number: Optional[str] = None
    items: List[PurchaseItemCreate] = Field(min_length=1)
    total_amount: Optional[float] = None  # ignored; server recomputes


class PurchaseResponse(BaseModel):
    id: UUID7
    party_id: UUID7
    date: datetime_date
    total_amount: float
    cash_payment: float
    upi_payment: float
    balance_amount: float
    driver_name: Optional[str] = None
    vehicle_number: Optional[str] = None
    items: List[PurchaseItemResponse]
    party_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


def _line_amount(quantity: float, rate: float) -> float:
    return round(float(quantity) * float(rate), 2)


async def _build_purchase_response(db: AsyncSession, purchase: Purchase) -> dict:
    party_name = purchase.party.name if purchase.party else None
    items_out = []
    for li in purchase.items:
        items_out.append(
            {
                "id": li.id,
                "item_id": li.item_id,
                "quantity": float(li.quantity),
                "count": li.count,
                "rate": float(li.rate),
                "amount": float(li.amount),
                "item_name_en": li.item.name_en if li.item else None,
                "item_name_ta": li.item.name_ta if li.item else None,
                "unit_type": li.item.unit_type.value if li.item else None,
            }
        )
    return {
        "id": purchase.id,
        "party_id": purchase.party_id,
        "date": purchase.date,
        "total_amount": float(purchase.total_amount),
        "cash_payment": float(purchase.cash_payment),
        "upi_payment": float(purchase.upi_payment),
        "balance_amount": float(purchase.balance_amount),
        "driver_name": purchase.driver_name,
        "vehicle_number": purchase.vehicle_number,
        "items": items_out,
        "party_name": party_name,
    }


async def _load_purchase(db: AsyncSession, purchase_id) -> Purchase | None:
    result = await db.execute(
        select(Purchase)
        .where(Purchase.id == purchase_id)
        .options(
            selectinload(Purchase.items).selectinload(PurchaseItem.item),
            selectinload(Purchase.party),
        )
    )
    return result.scalar_one_or_none()


async def _delete_purchase_txn(db: AsyncSession, purchase_id: UUID7):
    txn_result = await db.execute(
        select(PaymentTransaction).where(PaymentTransaction.purchase_id == purchase_id)
    )
    old_txn = txn_result.scalar_one_or_none()
    if old_txn:
        await db.delete(old_txn)


async def _revert_purchase(db: AsyncSession, purchase: Purchase, supplier: Party):
    old_paid = float(purchase.cash_payment) + float(purchase.upi_payment)
    supplier.current_balance = float(supplier.current_balance) - float(purchase.total_amount)
    supplier.current_balance = float(supplier.current_balance) + old_paid
    await _delete_purchase_txn(db, purchase.id)
    await InventoryService.revert_purchase_items(db, list(purchase.items))


async def _apply_purchase(
    db: AsyncSession, purchase_in: PurchaseCreate, supplier: Party, existing: Purchase | None = None
) -> Purchase:
    if supplier.type != PartyType.SUPPLIER:
        raise HTTPException(status_code=422, detail="Purchase party must be a SUPPLIER (Purchaser)")

    lines = []
    total = 0.0
    for item_in in purchase_in.items:
        # Ensure item exists
        res = await db.execute(select(Item).where(Item.id == item_in.item_id))
        if not res.scalar_one_or_none():
            raise HTTPException(status_code=404, detail=f"Item {item_in.item_id} not found")
        amount = _line_amount(item_in.quantity, item_in.rate)
        total += amount
        lines.append((item_in, amount))

    total = round(total, 2)
    cash = float(purchase_in.cash_payment or 0)
    upi = float(purchase_in.upi_payment or 0)
    balance = round(total - (cash + upi), 2)
    bill_date = purchase_in.date or datetime.now().date()

    if existing:
        db_purchase = existing
        # Clear old line items
        for old in list(db_purchase.items):
            await db.delete(old)
        await db.flush()
        db_purchase.party_id = purchase_in.party_id
        db_purchase.date = bill_date
        db_purchase.total_amount = total
        db_purchase.cash_payment = cash
        db_purchase.upi_payment = upi
        db_purchase.balance_amount = balance
        db_purchase.driver_name = purchase_in.driver_name
        db_purchase.vehicle_number = purchase_in.vehicle_number
    else:
        db_purchase = Purchase(
            party_id=purchase_in.party_id,
            date=bill_date,
            total_amount=total,
            cash_payment=cash,
            upi_payment=upi,
            balance_amount=balance,
            driver_name=purchase_in.driver_name,
            vehicle_number=purchase_in.vehicle_number,
        )
        db.add(db_purchase)
        await db.flush()

    db_items = []
    for item_in, amount in lines:
        db_item = PurchaseItem(
            purchase_id=db_purchase.id,
            item_id=item_in.item_id,
            quantity=item_in.quantity,
            count=item_in.count,
            rate=item_in.rate,
            amount=amount,
        )
        db.add(db_item)
        db_items.append(db_item)

    await db.flush()
    await InventoryService.process_purchase_items(db, db_items)

    total_paid = cash + upi
    if total_paid > 0:
        db.add(
            PaymentTransaction(
                party_id=purchase_in.party_id,
                purchase_id=db_purchase.id,
                date=bill_date,
                type=TransactionType.PAID,
                cash_amount=cash,
                upi_amount=upi,
                total_amount=total_paid,
            )
        )

    supplier.current_balance = float(supplier.current_balance) + total - total_paid
    return db_purchase


@router.post("/", response_model=PurchaseResponse, status_code=201)
async def create_purchase(purchase_in: PurchaseCreate, db: AsyncSession = Depends(deps.get_db)):
    result = await db.execute(select(Party).where(Party.id == purchase_in.party_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Purchaser not found")

    db_purchase = await _apply_purchase(db, purchase_in, supplier)
    await db.commit()
    full = await _load_purchase(db, db_purchase.id)
    return await _build_purchase_response(db, full)


@router.put("/{purchase_id}", response_model=PurchaseResponse)
async def update_purchase(
    purchase_id: UUID7,
    purchase_in: PurchaseCreate,
    db: AsyncSession = Depends(deps.get_db),
):
    existing = await _load_purchase(db, purchase_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Purchase not found")

    old_party_res = await db.execute(select(Party).where(Party.id == existing.party_id))
    old_supplier = old_party_res.scalar_one()
    await _revert_purchase(db, existing, old_supplier)
    await db.flush()

    new_party_res = await db.execute(select(Party).where(Party.id == purchase_in.party_id))
    supplier = new_party_res.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Purchaser not found")

    db_purchase = await _apply_purchase(db, purchase_in, supplier, existing=existing)
    await db.commit()
    full = await _load_purchase(db, db_purchase.id)
    return await _build_purchase_response(db, full)


@router.get("/", response_model=List[PurchaseResponse])
async def get_purchases(db: AsyncSession = Depends(deps.get_db)):
    result = await db.execute(
        select(Purchase)
        .options(
            selectinload(Purchase.items).selectinload(PurchaseItem.item),
            selectinload(Purchase.party),
        )
        .order_by(Purchase.date.desc())
    )
    purchases = result.scalars().all()
    return [await _build_purchase_response(db, p) for p in purchases]


@router.delete("/{purchase_id}", status_code=204)
async def delete_purchase(purchase_id: UUID7, db: AsyncSession = Depends(deps.get_db)):
    db_purchase = await _load_purchase(db, purchase_id)
    if not db_purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    result_party = await db.execute(select(Party).where(Party.id == db_purchase.party_id))
    supplier = result_party.scalar_one_or_none()
    if supplier:
        await _revert_purchase(db, db_purchase, supplier)

    await db.delete(db_purchase)
    await db.commit()
    return None
