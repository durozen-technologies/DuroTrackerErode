from datetime import datetime
import uuid
from uuid6 import uuid7 as generate_uuid7
from sqlalchemy import DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

def uuid7() -> uuid.UUID:
    return generate_uuid7()

class BaseModelMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
