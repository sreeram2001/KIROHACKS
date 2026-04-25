"""TEC computation models."""

from typing import Literal

from pydantic import BaseModel

from .base import CamelModel
from .ethics import FairnessVerdict
from .product import ProductData
from .profile import UserProfile


class CostLayerBreakdown(CamelModel):
    """Per-layer cost breakdown for a TEC computation."""

    risk_of_loss: float
    time_effort: float
    behavioral_pricing: float
    user_constraints: float
    path_effects: float


class Alternative(CamelModel):
    """A ranked alternative product."""

    product_name: str
    seller: str
    platform_id: str
    listed_price: float
    tec: float
    currency: str
    badge: Literal["Best for you", "Lowest risk", "Easiest return"]
    product_url: str
    layer_breakdown: CostLayerBreakdown
    dominant_layer: str


class ComparisonRow(CamelModel):
    """A row in the Decision Impact Report comparison table."""

    product_name: str
    seller: str
    listed_price: float
    tec: float
    dominant_layer: str
    is_original: bool


class ScenarioVariation(CamelModel):
    """A what-if scenario in the landscape view."""

    scenario_name: str
    variable_changed: str
    adjusted_tec: float
    delta_from_current: float


class CounterfactualResult(CamelModel):
    """Savings or cost from choosing an alternative."""

    alternative_name: str
    savings_or_cost: float  # positive = savings, negative = additional cost


class ProfileComparisonResult(CamelModel):
    """TEC comparison for a hypothetical user profile."""

    profile_label: str
    memberships: list[str]
    payment_methods: list[str]
    tec: float
    delta_from_user: float


class DecisionImpactReport(CamelModel):
    """Full Decision Impact Report for a product."""

    comparison_table: list[ComparisonRow]
    landscape_view: list[ScenarioVariation]  # >= 3 scenarios
    counterfactual_analysis: list[CounterfactualResult]
    profile_comparison: list[ProfileComparisonResult]  # >= 2 profiles
    fairness_verdict: FairnessVerdict


class TECRequest(CamelModel):
    """Incoming request to compute TEC."""

    product: ProductData
    user_profile: UserProfile


class TECResponse(CamelModel):
    """Full TEC computation response."""

    product_name: str
    listed_price: float
    tec: float
    currency: str
    layer_breakdown: CostLayerBreakdown
    alternatives: list[Alternative]
    alternatives_complete: bool
    decision_impact_report: DecisionImpactReport
    fairness_verdict: FairnessVerdict
