from datetime import date
from typing import List, Literal, Optional
from pydantic import UUID7, BaseModel
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date, and_

from app.api import deps
from app.models.purchase import Purchase, PurchaseItem
from app.models.sale import Sale, SaleItem
from app.models.expense import Expense, ExpenseCategory
from app.models.item import Item
from app.models.party import Party
from app.models.enums import PartyType, TransactionType
from app.models.transaction import PaymentTransaction

router = APIRouter()

GroupBy = Literal["date", "party", "item"]


class ReportRow(BaseModel):
    key: str
    label: str
    quantity: float = 0.0
    amount: float = 0.0
    count: int = 0


class ReportResponse(BaseModel):
    group_by: str
    rows: List[ReportRow]
    total_quantity: float
    total_amount: float


class ExpenseReportRow(BaseModel):
    date: date
    category_name: str
    cash_amount: float
    upi_amount: float
    total_amount: float
    count: int


class ExpenseReportResponse(BaseModel):
    group_by: str
    rows: List[ExpenseReportRow]
    total_cash: float
    total_upi: float
    total_amount: float


class InventoryReportRow(BaseModel):
    item_id: UUID7
    name_en: str
    name_ta: str
    unit_type: str
    available_stock: float
    used_stock: float
    purchased_quantity: float
    sold_quantity: float
    remaining_stock: float
    purchased_count: int
    sold_count: int
    available_count: int


class OutstandingRow(BaseModel):
    party_id: UUID7
    name: str
    company_name: Optional[str] = None
    party_type: str
    opening_balance: float
    bills_or_purchases: float
    payments: float
    pending_amount: float


def _date_filters(col, date_from: Optional[date], date_to: Optional[date]):
    clauses = []
    if date_from:
        clauses.append(col >= date_from)
    if date_to:
        clauses.append(col <= date_to)
    return clauses


async def _party_txn_report(
    db: AsyncSession,
    *,
    header_model,
    line_model,
    header_party_fk,
    header_date_col,
    header_id_col,
    line_header_fk,
    date_from: Optional[date],
    date_to: Optional[date],
    party_id: Optional[UUID7],
    item_id: Optional[UUID7],
    group_by: GroupBy,
) -> ReportResponse:
    if group_by == "date":
        # Column is already Date ΓÇö avoid cast() (breaks SQLite result processors)
        key_col = header_date_col
        label_expr = header_date_col
    elif group_by == "party":
        key_col = header_party_fk
        label_expr = Party.name
    else:
        key_col = line_model.item_id
        label_expr = Item.name_en

    qty = func.coalesce(func.sum(line_model.quantity), 0)
    amt = func.coalesce(func.sum(line_model.amount), 0)
    cnt = func.count(func.distinct(header_id_col))

    stmt = (
        select(key_col.label("key"), label_expr.label("label"), qty.label("quantity"), amt.label("amount"), cnt.label("count"))
        .select_from(line_model)
        .join(header_model, line_header_fk == header_id_col)
    )

    if group_by == "party":
        stmt = stmt.join(Party, Party.id == header_party_fk)
    if group_by == "item":
        stmt = stmt.join(Item, Item.id == line_model.item_id)

    clauses = _date_filters(header_date_col, date_from, date_to)
    if party_id:
        clauses.append(header_party_fk == party_id)
    if item_id:
        clauses.append(line_model.item_id == item_id)
    if clauses:
        stmt = stmt.where(and_(*clauses))

    stmt = stmt.group_by(key_col, label_expr).order_by(label_expr)
    result = await db.execute(stmt)
    rows = []
    total_qty = 0.0
    total_amt = 0.0
    for r in result.all():
        q = float(r.quantity)
        a = float(r.amount)
        total_qty += q
        total_amt += a
        rows.append(
            ReportRow(
                key=str(r.key),
                label=str(r.label),
                quantity=q,
                amount=a,
                count=int(r.count),
            )
        )
    return ReportResponse(
        group_by=group_by,
        rows=rows,
        total_quantity=round(total_qty, 2),
        total_amount=round(total_amt, 2),
    )


@router.get("/purchases", response_model=ReportResponse)
async def purchase_report(
    date_from: Optional[date] = Query(None, alias="from"),
    date_to: Optional[date] = Query(None, alias="to"),
    party_id: Optional[UUID7] = None,
    item_id: Optional[UUID7] = None,
    group_by: GroupBy = "date",
    db: AsyncSession = Depends(deps.get_db),
):
    return await _party_txn_report(
        db,
        header_model=Purchase,
        line_model=PurchaseItem,
        header_party_fk=Purchase.party_id,
        header_date_col=Purchase.date,
        header_id_col=Purchase.id,
        line_header_fk=PurchaseItem.purchase_id,
        date_from=date_from,
        date_to=date_to,
        party_id=party_id,
        item_id=item_id,
        group_by=group_by,
    )


@router.get("/sales", response_model=ReportResponse)
async def sales_report(
    date_from: Optional[date] = Query(None, alias="from"),
    date_to: Optional[date] = Query(None, alias="to"),
    party_id: Optional[UUID7] = None,
    item_id: Optional[UUID7] = None,
    group_by: GroupBy = "date",
    db: AsyncSession = Depends(deps.get_db),
):
    return await _party_txn_report(
        db,
        header_model=Sale,
        line_model=SaleItem,
        header_party_fk=Sale.party_id,
        header_date_col=Sale.date,
        header_id_col=Sale.id,
        line_header_fk=SaleItem.sale_id,
        date_from=date_from,
        date_to=date_to,
        party_id=party_id,
        item_id=item_id,
        group_by=group_by,
    )


@router.get("/inventory", response_model=List[InventoryReportRow])
async def inventory_report(db: AsyncSession = Depends(deps.get_db)):
    purchased = (
        select(
            PurchaseItem.item_id.label("item_id"),
            func.coalesce(func.sum(PurchaseItem.quantity), 0).label("purchased"),
            func.coalesce(func.sum(PurchaseItem.count), 0).label("purchased_count"),
        )
        .group_by(PurchaseItem.item_id)
        .subquery()
    )
    sold = (
        select(
            SaleItem.item_id.label("item_id"),
            func.coalesce(func.sum(SaleItem.quantity), 0).label("sold"),
            func.coalesce(func.sum(SaleItem.count), 0).label("sold_count"),
        )
        .group_by(SaleItem.item_id)
        .subquery()
    )
    stmt = (
        select(
            Item,
            func.coalesce(purchased.c.purchased, 0).label("purchased_quantity"),
            func.coalesce(sold.c.sold, 0).label("sold_quantity"),
            func.coalesce(purchased.c.purchased_count, 0).label("purchased_count"),
            func.coalesce(sold.c.sold_count, 0).label("sold_count"),
        )
        .outerjoin(purchased, purchased.c.item_id == Item.id)
        .outerjoin(sold, sold.c.item_id == Item.id)
        .order_by(Item.name_en)
    )
    result = await db.execute(stmt)
    rows = []
    for item, purchased_qty, sold_qty, purchased_count, sold_count in result.all():
        p_count = int(purchased_count or 0)
        s_count = int(sold_count or 0)
        rows.append(
            InventoryReportRow(
                item_id=item.id,
                name_en=item.name_en,
                name_ta=item.name_ta,
                unit_type=item.unit_type.value,
                available_stock=float(item.available_stock),
                used_stock=float(item.used_stock),
                purchased_quantity=float(purchased_qty),
                sold_quantity=float(sold_qty),
                remaining_stock=float(item.available_stock),
                purchased_count=p_count,
                sold_count=s_count,
                available_count=p_count - s_count,
            )
        )
    return rows


@router.get("/expenses", response_model=ExpenseReportResponse)
async def expense_report(
    date_from: Optional[date] = Query(None, alias="from"),
    date_to: Optional[date] = Query(None, alias="to"),
    db: AsyncSession = Depends(deps.get_db),
):
    spent_date = cast(Expense.spent_at, Date)
    
    cash = func.coalesce(func.sum(Expense.cash_amount), 0)
    upi = func.coalesce(func.sum(Expense.upi_amount), 0)
    total = func.coalesce(func.sum(Expense.total_amount), 0)
    cnt = func.count(Expense.id)

    stmt = (
        select(
            spent_date.label("date"),
            ExpenseCategory.name_en.label("category_name"),
            cash.label("cash_amount"),
            upi.label("upi_amount"),
            total.label("total_amount"),
            cnt.label("count"),
        )
        .select_from(Expense)
        .join(ExpenseCategory, ExpenseCategory.id == Expense.category_id)
    )

    clauses = _date_filters(spent_date, date_from, date_to)
    if clauses:
        stmt = stmt.where(and_(*clauses))

    stmt = stmt.group_by(spent_date, ExpenseCategory.name_en).order_by(spent_date.desc(), ExpenseCategory.name_en)
    result = await db.execute(stmt)
    rows = []
    total_cash = total_upi = total_amt = 0.0
    for r in result.all():
        c = float(r.cash_amount)
        u = float(r.upi_amount)
        t = float(r.total_amount)
        total_cash += c
        total_upi += u
        total_amt += t
        rows.append(
            ExpenseReportRow(
                date=r.date,
                category_name=str(r.category_name),
                cash_amount=c,
                upi_amount=u,
                total_amount=t,
                count=int(r.count),
            )
        )
    return ExpenseReportResponse(
        group_by="detailed",
        rows=rows,
        total_cash=round(total_cash, 2),
        total_upi=round(total_upi, 2),
        total_amount=round(total_amt, 2),
    )


def _date_filters(col, date_from: Optional[date], date_to: Optional[date]):
    clauses = []
    if date_from:
        clauses.append(col >= date_from)
    if date_to:
        clauses.append(col <= date_to)
    return clauses


async def _party_txn_report(
    db: AsyncSession,
    *,
    header_model,
    line_model,
    header_party_fk,
    header_date_col,
    header_id_col,
    line_header_fk,
    date_from: Optional[date],
    date_to: Optional[date],
    party_id: Optional[UUID7],
    item_id: Optional[UUID7],
    group_by: GroupBy,
) -> ReportResponse:
    if group_by == "date":
        # Column is already Date — avoid cast() (breaks SQLite result processors)
        key_col = header_date_col
        label_expr = header_date_col
    elif group_by == "party":
        key_col = header_party_fk
        label_expr = Party.name
    else:
        key_col = line_model.item_id
        label_expr = Item.name_en

    qty = func.coalesce(func.sum(line_model.quantity), 0)
    amt = func.coalesce(func.sum(line_model.amount), 0)
    cnt = func.count(func.distinct(header_id_col))

    stmt = (
        select(key_col.label("key"), label_expr.label("label"), qty.label("quantity"), amt.label("amount"), cnt.label("count"))
        .select_from(line_model)
        .join(header_model, line_header_fk == header_id_col)
    )

    if group_by == "party":
        stmt = stmt.join(Party, Party.id == header_party_fk)
    if group_by == "item":
        stmt = stmt.join(Item, Item.id == line_model.item_id)

    clauses = _date_filters(header_date_col, date_from, date_to)
    if party_id:
        clauses.append(header_party_fk == party_id)
    if item_id:
        clauses.append(line_model.item_id == item_id)
    if clauses:
        stmt = stmt.where(and_(*clauses))

    stmt = stmt.group_by(key_col, label_expr).order_by(label_expr)
    result = await db.execute(stmt)
    rows = []
    total_qty = 0.0
    total_amt = 0.0
    for r in result.all():
        q = float(r.quantity)
        a = float(r.amount)
        total_qty += q
        total_amt += a
        rows.append(
            ReportRow(
                key=str(r.key),
                label=str(r.label),
                quantity=q,
                amount=a,
                count=int(r.count),
            )
        )
    return ReportResponse(
        group_by=group_by,
        rows=rows,
        total_quantity=round(total_qty, 2),
        total_amount=round(total_amt, 2),
    )


@router.get("/purchases", response_model=ReportResponse)
async def purchase_report(
    date_from: Optional[date] = Query(None, alias="from"),
    date_to: Optional[date] = Query(None, alias="to"),
    db: AsyncSession = Depends(deps.get_db),
):
    return await _party_txn_report(
        db,
        header_model=Purchase,
        line_model=PurchaseItem,
        header_party_fk=Purchase.party_id,
        header_date_col=Purchase.date,
        header_id_col=Purchase.id,
        line_header_fk=PurchaseItem.purchase_id,
        date_from=date_from,
        date_to=date_to,
        party_id=None,
        item_id=None,
        group_by="party",
    )


class DetailedPurchaseRow(BaseModel):
    date: date
    party_name: str
    item_name: str
    quantity: float
    count: int
    amount: float

class DetailedSaleRow(BaseModel):
    date: date
    party_name: str
    item_name: str
    quantity: float
    count: int
    amount: float

@router.get("/purchases/detailed", response_model=List[DetailedPurchaseRow])
async def detailed_purchase_report(
    party_id: UUID7,
    date_from: Optional[date] = Query(None, alias="from"),
    date_to: Optional[date] = Query(None, alias="to"),
    db: AsyncSession = Depends(deps.get_db),
):
    stmt = (
        select(
            Purchase.date.label("date"),
            Party.name.label("party_name"),
            Item.name_en.label("item_name"),
            PurchaseItem.quantity.label("quantity"),
            PurchaseItem.count.label("count"),
            PurchaseItem.amount.label("amount")
        )
        .select_from(PurchaseItem)
        .join(Purchase, Purchase.id == PurchaseItem.purchase_id)
        .join(Party, Party.id == Purchase.party_id)
        .join(Item, Item.id == PurchaseItem.item_id)
        .where(Purchase.party_id == party_id)
    )
    if date_from:
        stmt = stmt.where(Purchase.date >= date_from)
    if date_to:
        stmt = stmt.where(Purchase.date <= date_to)
    
    stmt = stmt.order_by(Purchase.date, Item.name_en)
    
    result = await db.execute(stmt)
    rows = []
    for r in result.all():
        rows.append(DetailedPurchaseRow(
            date=r.date,
            party_name=r.party_name,
            item_name=r.item_name,
            quantity=float(r.quantity),
            count=int(r.count),
            amount=float(r.amount)
        ))
    return rows


@router.get("/sales/detailed", response_model=List[DetailedSaleRow])
async def detailed_sales_report(
    party_id: UUID7,
    date_from: Optional[date] = Query(None, alias="from"),
    date_to: Optional[date] = Query(None, alias="to"),
    db: AsyncSession = Depends(deps.get_db),
):
    stmt = (
        select(
            Sale.date.label("date"),
            Party.name.label("party_name"),
            Item.name_en.label("item_name"),
            SaleItem.quantity.label("quantity"),
            SaleItem.count.label("count"),
            SaleItem.amount.label("amount")
        )
        .select_from(SaleItem)
        .join(Sale, Sale.id == SaleItem.sale_id)
        .join(Party, Party.id == Sale.party_id)
        .join(Item, Item.id == SaleItem.item_id)
        .where(Sale.party_id == party_id)
    )
    if date_from:
        stmt = stmt.where(Sale.date >= date_from)
    if date_to:
        stmt = stmt.where(Sale.date <= date_to)
    
    stmt = stmt.order_by(Sale.date, Item.name_en)
    
    result = await db.execute(stmt)
    rows = []
    for r in result.all():
        rows.append(DetailedSaleRow(
            date=r.date,
            party_name=r.party_name,
            item_name=r.item_name,
            quantity=float(r.quantity),
            count=int(r.count),
            amount=float(r.amount)
        ))
    return rows
@router.get("/sales", response_model=ReportResponse)
async def sales_report(
    date_from: Optional[date] = Query(None, alias="from"),
    date_to: Optional[date] = Query(None, alias="to"),
    db: AsyncSession = Depends(deps.get_db),
):
    return await _party_txn_report(
        db,
        header_model=Sale,
        line_model=SaleItem,
        header_party_fk=Sale.party_id,
        header_date_col=Sale.date,
        header_id_col=Sale.id,
        line_header_fk=SaleItem.sale_id,
        date_from=date_from,
        date_to=date_to,
        party_id=None,
        item_id=None,
        group_by="party",
    )


@router.get("/expenses", response_model=ExpenseReportResponse)
async def expense_report(
    date_from: Optional[date] = Query(None, alias="from"),
    date_to: Optional[date] = Query(None, alias="to"),
    db: AsyncSession = Depends(deps.get_db),
):
    spent_date = cast(Expense.spent_at, Date)
    
    cash = func.coalesce(func.sum(Expense.cash_amount), 0)
    upi = func.coalesce(func.sum(Expense.upi_amount), 0)
    total = func.coalesce(func.sum(Expense.total_amount), 0)
    cnt = func.count(Expense.id)

    stmt = (
        select(
            spent_date.label("date"),
            ExpenseCategory.name_en.label("category_name"),
            cash.label("cash_amount"),
            upi.label("upi_amount"),
            total.label("total_amount"),
            cnt.label("count"),
        )
        .select_from(Expense)
        .join(ExpenseCategory, ExpenseCategory.id == Expense.category_id)
    )

    clauses = _date_filters(spent_date, date_from, date_to)
    if clauses:
        stmt = stmt.where(and_(*clauses))

    stmt = stmt.group_by(spent_date, ExpenseCategory.name_en).order_by(spent_date.desc(), ExpenseCategory.name_en)
    result = await db.execute(stmt)
    rows = []
    total_cash = total_upi = total_amt = 0.0
    for r in result.all():
        c = float(r.cash_amount)
        u = float(r.upi_amount)
        t = float(r.total_amount)
        total_cash += c
        total_upi += u
        total_amt += t
        rows.append(
            ExpenseReportRow(
                date=r.date,
                category_name=str(r.category_name),
                cash_amount=c,
                upi_amount=u,
                total_amount=t,
                count=int(r.count),
            )
        )
    return ExpenseReportResponse(
        group_by="detailed",
        rows=rows,
        total_cash=round(total_cash, 2),
        total_upi=round(total_upi, 2),
        total_amount=round(total_amt, 2),
    )


@router.get("/inventory", response_model=List[InventoryReportRow])
async def inventory_report(db: AsyncSession = Depends(deps.get_db)):
    purchased = (
        select(
            PurchaseItem.item_id.label("item_id"),
            func.coalesce(func.sum(PurchaseItem.quantity), 0).label("purchased"),
            func.coalesce(func.sum(PurchaseItem.count), 0).label("purchased_count"),
        )
        .group_by(PurchaseItem.item_id)
        .subquery()
    )
    sold = (
        select(
            SaleItem.item_id.label("item_id"),
            func.coalesce(func.sum(SaleItem.quantity), 0).label("sold"),
            func.coalesce(func.sum(SaleItem.count), 0).label("sold_count"),
        )
        .group_by(SaleItem.item_id)
        .subquery()
    )
    stmt = (
        select(
            Item,
            func.coalesce(purchased.c.purchased, 0).label("purchased_quantity"),
            func.coalesce(sold.c.sold, 0).label("sold_quantity"),
            func.coalesce(purchased.c.purchased_count, 0).label("purchased_count"),
            func.coalesce(sold.c.sold_count, 0).label("sold_count"),
        )
        .outerjoin(purchased, purchased.c.item_id == Item.id)
        .outerjoin(sold, sold.c.item_id == Item.id)
        .order_by(Item.name_en)
    )
    result = await db.execute(stmt)
    rows = []
    for item, purchased_qty, sold_qty, purchased_count, sold_count in result.all():
        p_count = int(purchased_count or 0)
        s_count = int(sold_count or 0)
        rows.append(
            InventoryReportRow(
                item_id=item.id,
                name_en=item.name_en,
                name_ta=item.name_ta,
                unit_type=item.unit_type.value,
                available_stock=float(item.available_stock),
                used_stock=float(item.used_stock),
                purchased_quantity=float(purchased_qty),
                sold_quantity=float(sold_qty),
                remaining_stock=float(item.available_stock),
                purchased_count=p_count,
                sold_count=s_count,
                available_count=p_count - s_count,
            )
        )
    return rows




class OutstandingRow(BaseModel):
    party_id: UUID7
    name: str
    company_name: Optional[str] = None
    party_type: str
    opening_balance: float
    bills_or_purchases: float
    payments: float
    pending_amount: float


@router.get("/outstanding", response_model=List[OutstandingRow])
async def outstanding_report(
    party_type: Optional[PartyType] = None,
    db: AsyncSession = Depends(deps.get_db),
):
    """Outstanding from party balances + bill/payment sums for transparency."""
    query = select(Party).where(Party.is_active.is_(True))
    if party_type:
        query = query.where(Party.type == party_type)
    parties = (await db.execute(query.order_by(Party.name))).scalars().all()

    rows = []
    for p in parties:
        if p.type == PartyType.SUPPLIER:
            bills = float(
                (
                    await db.execute(
                        select(func.coalesce(func.sum(Purchase.total_amount), 0)).where(
                            Purchase.party_id == p.id
                        )
                    )
                ).scalar()
                or 0
            )
            payments = float(
                (
                    await db.execute(
                        select(func.coalesce(func.sum(PaymentTransaction.total_amount), 0)).where(
                            PaymentTransaction.party_id == p.id,
                            PaymentTransaction.type == TransactionType.PAID,
                        )
                    )
                ).scalar()
                or 0
            )
        else:
            bills = float(
                (
                    await db.execute(
                        select(func.coalesce(func.sum(Sale.total_amount), 0)).where(
                            Sale.party_id == p.id
                        )
                    )
                ).scalar()
                or 0
            )
            payments = float(
                (
                    await db.execute(
                        select(func.coalesce(func.sum(PaymentTransaction.total_amount), 0)).where(
                            PaymentTransaction.party_id == p.id,
                            PaymentTransaction.type == TransactionType.RECEIVED,
                        )
                    )
                ).scalar()
                or 0
            )

        rows.append(
            OutstandingRow(
                party_id=p.id,
                name=p.name,
                company_name=p.company_name,
                party_type=p.type.value,
                opening_balance=float(p.opening_balance),
                bills_or_purchases=bills,
                payments=payments,
                pending_amount=float(p.current_balance),
            )
        )
    return rows
