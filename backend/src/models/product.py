"""Product data model."""

from typing import Literal

from pydantic import BaseModel

from .base import CamelModel


class ProductData(CamelModel):
    """Structured product data extracted from a web page."""

    product_name: str
    listed_price: float
    currency: str
    seller: str
    platform_id: str
    page_url: str
    page_type: Literal["product", "booking", "subscription"]
    extracted_at: str  # ISO 8601
