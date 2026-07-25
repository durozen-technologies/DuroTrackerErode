from datetime import date
from uuid import UUID

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.database import Base
from .base import BaseModelMixin, uuid7


class Purchase(Base, BaseModelMixin):
    __tablename__ = "purchases"

    id: Mapped[UUID] = mapped_column(primary_key=True, index=True, default=uuid7)
    party_id: Mapped[UUID] = mapped_column(ForeignKey("parties.id"), nullable=False, index=True)
    
    date: Mapped[date] = mapped_column(Date, nullable=False)
    
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    cash_payment: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    upi_payment: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    balance_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    driver_name: Mapped[str | None] = mapped_column(String, nullable=True)
    vehicle_number: Mapped[str | None] = mapped_column(String, nullable=True)

    party = relationship("Party", back_populates="purchases")
    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")


class PurchaseItem(Base, BaseModelMixin):
    __tablename__ = "purchase_items"

    id: Mapped[UUID] = mapped_column(primary_key=True, index=True, default=uuid7)
    purchase_id: Mapped[UUID] = mapped_column(ForeignKey("purchases.id"), nullable=False, index=True)
    item_id: Mapped[UUID] = mapped_column(ForeignKey("items.id"), nullable=False, index=True)
    
    quantity: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rate: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)

    purchase = relationship("Purchase", back_populates="items")
    item = relationship("Item", back_populates="purchase_items")
