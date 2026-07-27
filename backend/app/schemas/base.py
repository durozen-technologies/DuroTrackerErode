from pydantic import BaseModel
from typing import Generic, TypeVar, List, Optional, Any

DataT = TypeVar("DataT")


class Pagination(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int


class PaginatedResponse(BaseModel, Generic[DataT]):
    data: List[DataT]
    pagination: Pagination


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None


class APIError(BaseModel):
    error: ErrorDetail
