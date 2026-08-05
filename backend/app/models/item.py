from uuid import UUID
from sqlalchemy import Enum, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.database import Base
from .base import BaseModelMixin, uuid7
from .enums import UnitType


class Item(Base, BaseModelMixin):
    __tablename__ = "items"

    id: Mapped[UUID] = mapped_column(primary_key=True, index=True, default=uuid7)
    name_ta: Mapped[str] = mapped_column(String(255), nullable=False)
    name_en: Mapped[str] = mapped_column(String(255), nullable=False)
    unit_type: Mapped[UnitType] = mapped_column(Enum(UnitType), nullable=False)
    
    available_stock: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    used_stock: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    min_stock_alert: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    
    purchase_items = relationship("PurchaseItem", back_populates="item")
    sale_items = relationship("SaleItem", back_populates="item")
