"""TrueCost Engine Pydantic data models."""

from .product import ProductData
from .profile import (
    CashbackCategory,
    CitizenshipResidency,
    Membership,
    PaymentMethod,
    StudentStatus,
    UserProfile,
)
from .ethics import FairnessVerdict, PricingFactor
from .tec import (
    Alternative,
    ComparisonRow,
    CostLayerBreakdown,
    CounterfactualResult,
    DecisionImpactReport,
    ProfileComparisonResult,
    ScenarioVariation,
    TECRequest,
    TECResponse,
)
from .chat import ChatMessage, ChatRequest, ChatResponse
from .errors import ErrorDetail, ErrorResponse, ValidationErrorDetail

__all__ = [
    "ProductData",
    "CashbackCategory",
    "CitizenshipResidency",
    "Membership",
    "PaymentMethod",
    "StudentStatus",
    "UserProfile",
    "FairnessVerdict",
    "PricingFactor",
    "Alternative",
    "ComparisonRow",
    "CostLayerBreakdown",
    "CounterfactualResult",
    "DecisionImpactReport",
    "ProfileComparisonResult",
    "ScenarioVariation",
    "TECRequest",
    "TECResponse",
    "ChatMessage",
    "ChatRequest",
    "ChatResponse",
    "ErrorDetail",
    "ErrorResponse",
    "ValidationErrorDetail",
]
