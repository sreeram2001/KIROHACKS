"""User profile and related models."""

from typing import Literal

from pydantic import BaseModel, Field

from .base import CamelModel


class CashbackCategory(CamelModel):
    """A cashback category with its percentage."""

    category: str
    percentage: float = Field(ge=0.0)


class PaymentMethod(CamelModel):
    """A payment method with cashback categories."""

    id: str
    name: str
    cashback_categories: list[CashbackCategory]


class Membership(CamelModel):
    """A retail or service membership."""

    provider: Literal[
        "amazon_prime",
        "walmart_plus",
        "target_circle_360",
        "sams_club",
        "costco",
    ]
    active: bool
    renewal_date: str | None = None  # ISO 8601
    annual_cost: float


class StudentStatus(CamelModel):
    """Verified student identity."""

    edu_email: str
    verified: bool
    verified_at: str  # ISO 8601


class CitizenshipResidency(CamelModel):
    """Citizenship or residency information."""

    country: str  # ISO 3166-1 alpha-2
    region: str | None = None


class UserProfile(CamelModel):
    """Full user profile for TEC personalisation."""

    user_id: str
    memberships: list[Membership]
    student_status: StudentStatus | None = None
    payment_methods: list[PaymentMethod]
    return_comfort_level: int = Field(ge=1, le=5)
    citizenship_residency: CitizenshipResidency | None = None
    cloud_sync_enabled: bool
    last_modified: str  # ISO 8601
