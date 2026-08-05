from pydantic import UUID7, BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.api import deps
from app.models.item import Item
from app.models.enums import UnitType

router = APIRouter()


class ItemBase(BaseModel):
    name_ta: str
    name_en: str
    unit_type: UnitType
    min_stock_alert: float = 0.0

class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name_ta: Optional[str] = None
    name_en: Optional[str] = None
    unit_type: Optional[UnitType] = None
    min_stock_alert: Optional[float] = None

class ItemResponse(ItemBase):
    id: UUID7
    available_stock: float
    used_stock: float

    model_config = ConfigDict(from_attributes=True)


@router.get("/", response_model=List[ItemResponse])
async def get_items(db: AsyncSession = Depends(deps.get_db)):
    result = await db.execute(select(Item).order_by(Item.name_en))
    return result.scalars().all()


@router.post("/", response_model=ItemResponse, status_code=201)
async def create_item(item: ItemCreate, db: AsyncSession = Depends(deps.get_db)):
    db_item = Item(
        name_ta=item.name_ta,
        name_en=item.name_en,
        unit_type=item.unit_type,
        min_stock_alert=item.min_stock_alert,
    )
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item


@router.put("/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: UUID7,
    item_update: ItemUpdate,
    db: AsyncSession = Depends(deps.get_db),
):
    result = await db.execute(select(Item).where(Item.id == item_id))
    db_item = result.scalar_one_or_none()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    for key, value in item_update.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)

    await db.commit()
    await db.refresh(db_item)
    return db_item
