from pydantic import UUID7, ConfigDict, BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, date as datetime_date

from app.api import deps
from app.models.sale import Sale, SaleItem
from app.models.party import Party
from app.models.item import Item
from app.models.transaction import PaymentTransaction
from app.models.enums import TransactionType, PartyType
from app.services.inventory_service import InventoryService

router = APIRouter()


class SaleItemCreate(BaseModel):
    item_id: UUID7
    quantity: float = Field(gt=0)
    count: Optional[int] = None
    rate: float = Field(ge=0)
    amount: Optional[float] = None  # ignored; server recomputes


class SaleItemResponse(BaseModel):
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


class SaleCreate(BaseModel):
    party_id: UUID7
    date: Optional[datetime_date] = None
    cash_payment: float = 0.0
    upi_payment: float = 0.0
    driver_name: Optional[str] = None
    vehicle_number: Optional[str] = None
    items: List[SaleItemCreate] = Field(min_length=1)
    total_amount: Optional[float] = None  # ignored; server recomputes


class SaleResponse(BaseModel):
    id: UUID7
    party_id: UUID7
    date: datetime_date
    total_amount: float
    cash_payment: float
    upi_payment: float
    balance_amount: float
    driver_name: Optional[str] = None
    vehicle_number: Optional[str] = None
    items: List[SaleItemResponse]
    party_name: Optional[str] = None
    low_stock_alerts: Optional[List[dict]] = None

    model_config = ConfigDict(from_attributes=True)


def _line_amount(quantity: float, rate: float) -> float:
    return round(float(quantity) * float(rate), 2)


async def _build_sale_response(db: AsyncSession, sale: Sale) -> dict:
    party_name = sale.party.name if sale.party else None
    items_out = []
    for li in sale.items:
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
    low_stock_alerts = []
    for li in sale.items:
        if li.item and float(li.item.min_stock_alert) > 0 and float(li.item.available_stock) <= float(li.item.min_stock_alert):
            low_stock_alerts.append({
                "item_name": li.item.name_en,
                "available": float(li.item.available_stock),
                "minimum": float(li.item.min_stock_alert),
            })
            
    return {
        "id": sale.id,
        "party_id": sale.party_id,
        "date": sale.date,
        "total_amount": float(sale.total_amount),
        "cash_payment": float(sale.cash_payment),
        "upi_payment": float(sale.upi_payment),
        "balance_amount": float(sale.balance_amount),
        "driver_name": sale.driver_name,
        "vehicle_number": sale.vehicle_number,
        "items": items_out,
        "party_name": party_name,
        "low_stock_alerts": low_stock_alerts,
    }


async def _load_sale(db: AsyncSession, sale_id) -> Sale | None:
    result = await db.execute(
        select(Sale)
        .where(Sale.id == sale_id)
        .options(
            selectinload(Sale.items).selectinload(SaleItem.item),
            selectinload(Sale.party),
        )
    )
    return result.scalar_one_or_none()


async def _delete_sale_txn(db: AsyncSession, sale_id: UUID7):
    txn_result = await db.execute(
        select(PaymentTransaction).where(PaymentTransaction.sale_id == sale_id)
    )
    old_txn = txn_result.scalar_one_or_none()
    if old_txn:
        await db.delete(old_txn)


async def _revert_sale(db: AsyncSession, sale: Sale, customer: Party):
    old_collected = float(sale.cash_payment) + float(sale.upi_payment)
    customer.current_balance = float(customer.current_balance) - float(sale.total_amount)
    customer.current_balance = float(customer.current_balance) + old_collected
    await _delete_sale_txn(db, sale.id)
    await InventoryService.revert_sale_items(db, list(sale.items))


async def _apply_sale(
    db: AsyncSession, sale_in: SaleCreate, customer: Party, existing: Sale | None = None
) -> Sale:
    if customer.type != PartyType.CUSTOMER:
        raise HTTPException(status_code=422, detail="Sale party must be a CUSTOMER")

    lines = []
    total = 0.0
    for item_in in sale_in.items:
        res = await db.execute(select(Item).where(Item.id == item_in.item_id))
        if not res.scalar_one_or_none():
            raise HTTPException(status_code=404, detail=f"Item {item_in.item_id} not found")
        amount = _line_amount(item_in.quantity, item_in.rate)
        total += amount
        lines.append((item_in, amount))

    total = round(total, 2)
    cash = float(sale_in.cash_payment or 0)
    upi = float(sale_in.upi_payment or 0)
    balance = round(total - (cash + upi), 2)
    bill_date = sale_in.date or datetime.now().date()

    if existing:
        db_sale = existing
        for old in list(db_sale.items):
            await db.delete(old)
        await db.flush()
        db_sale.party_id = sale_in.party_id
        db_sale.date = bill_date
        db_sale.total_amount = total
        db_sale.cash_payment = cash
        db_sale.upi_payment = upi
        db_sale.balance_amount = balance
        db_sale.driver_name = sale_in.driver_name
        db_sale.vehicle_number = sale_in.vehicle_number
    else:
        db_sale = Sale(
            party_id=sale_in.party_id,
            date=bill_date,
            total_amount=total,
            cash_payment=cash,
            upi_payment=upi,
            balance_amount=balance,
            driver_name=sale_in.driver_name,
            vehicle_number=sale_in.vehicle_number,
        )
        db.add(db_sale)
        await db.flush()

    db_items = []
    for item_in, amount in lines:
        db_item = SaleItem(
            sale_id=db_sale.id,
            item_id=item_in.item_id,
            quantity=item_in.quantity,
            count=item_in.count,
            rate=item_in.rate,
            amount=amount,
        )
        db.add(db_item)
        db_items.append(db_item)

    await db.flush()
    await InventoryService.process_sale_items(db, db_items)

    total_collected = cash + upi
    if total_collected > 0:
        db.add(
            PaymentTransaction(
                party_id=sale_in.party_id,
                sale_id=db_sale.id,
                date=bill_date,
                type=TransactionType.RECEIVED,
                cash_amount=cash,
                upi_amount=upi,
                total_amount=total_collected,
            )
        )

    customer.current_balance = float(customer.current_balance) + total - total_collected
    return db_sale


@router.post("/", response_model=SaleResponse, status_code=201)
async def create_sale(sale_in: SaleCreate, db: AsyncSession = Depends(deps.get_db)):
    result = await db.execute(select(Party).where(Party.id == sale_in.party_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db_sale = await _apply_sale(db, sale_in, customer)
    await db.commit()
    full = await _load_sale(db, db_sale.id)
    return await _build_sale_response(db, full)


@router.put("/{sale_id}", response_model=SaleResponse)
async def update_sale(
    sale_id: UUID7,
    sale_in: SaleCreate,
    db: AsyncSession = Depends(deps.get_db),
):
    existing = await _load_sale(db, sale_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Sale not found")

    old_party_res = await db.execute(select(Party).where(Party.id == existing.party_id))
    old_customer = old_party_res.scalar_one()
    await _revert_sale(db, existing, old_customer)
    await db.flush()

    new_party_res = await db.execute(select(Party).where(Party.id == sale_in.party_id))
    customer = new_party_res.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db_sale = await _apply_sale(db, sale_in, customer, existing=existing)
    await db.commit()
    full = await _load_sale(db, db_sale.id)
    return await _build_sale_response(db, full)


@router.get("/", response_model=List[SaleResponse])
async def get_sales(db: AsyncSession = Depends(deps.get_db)):
    result = await db.execute(
        select(Sale)
        .options(
            selectinload(Sale.items).selectinload(SaleItem.item),
            selectinload(Sale.party),
        )
        .order_by(Sale.date.desc())
    )
    sales = result.scalars().all()
    return [await _build_sale_response(db, s) for s in sales]


@router.delete("/{sale_id}", status_code=204)
async def delete_sale(sale_id: UUID7, db: AsyncSession = Depends(deps.get_db)):
    db_sale = await _load_sale(db, sale_id)
    if not db_sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    result_party = await db.execute(select(Party).where(Party.id == db_sale.party_id))
    customer = result_party.scalar_one_or_none()
    if customer:
        await _revert_sale(db, db_sale, customer)

    await db.delete(db_sale)
    await db.commit()
    return None
