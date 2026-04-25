"""Ethics Gate models."""

from typing import Literal

from pydantic import BaseModel, Field

from .base import CamelModel


class PricingFactor(CamelModel):
    """A single pricing factor with its classification."""

    name: str
    classification: Literal["justified", "unjustified"]
    weight: float = Field(ge=0.0, le=1.0)
    explanation: str


class FairnessVerdict(CamelModel):
    """Output of the Ethics Gate evaluation."""

    verdict: Literal["clean", "flagged", "halted"]
    factors: list[PricingFactor]
    explanation: str | None = None
    timestamp: str  # ISO 8601
    product_id: str
