"""Tests for Pydantic data models."""

import pytest
from pydantic import ValidationError

from models import (
    Alternative,
    CashbackCategory,
    ChatMessage,
    ChatRequest,
    ChatResponse,
    CitizenshipResidency,
    ComparisonRow,
    CostLayerBreakdown,
    CounterfactualResult,
    DecisionImpactReport,
    ErrorDetail,
    ErrorResponse,
    FairnessVerdict,
    Membership,
    PaymentMethod,
    PricingFactor,
    ProductData,
    ProfileComparisonResult,
    ScenarioVariation,
    StudentStatus,
    TECRequest,
    TECResponse,
    UserProfile,
    ValidationErrorDetail,
)


def _make_product() -> ProductData:
    return ProductData(
        product_name="Widget",
        listed_price=29.99,
        currency="USD",
        seller="Acme",
        platform_id="amazon",
        page_url="https://example.com/widget",
        page_type="product",
        extracted_at="2025-01-01T00:00:00Z",
    )


def _make_profile() -> UserProfile:
    return UserProfile(
        user_id="u1",
        memberships=[],
        student_status=None,
        payment_methods=[],
        return_comfort_level=3,
        citizenship_residency=None,
        cloud_sync_enabled=False,
        last_modified="2025-01-01T00:00:00Z",
    )


def _make_layer() -> CostLayerBreakdown:
    return CostLayerBreakdown(
        risk_of_loss=1.0,
        time_effort=2.0,
        behavioral_pricing=0.5,
        user_constraints=0.3,
        path_effects=0.2,
    )


def _make_verdict() -> FairnessVerdict:
    return FairnessVerdict(
        verdict="clean",
        factors=[],
        explanation=None,
        timestamp="2025-01-01T00:00:00Z",
        product_id="p1",
    )


class TestProductData:
    def test_valid(self):
        p = _make_product()
        assert p.product_name == "Widget"
        assert p.page_type == "product"

    def test_invalid_page_type(self):
        with pytest.raises(ValidationError):
            ProductData(
                product_name="X",
                listed_price=1.0,
                currency="USD",
                seller="S",
                platform_id="p",
                page_url="https://x.com",
                page_type="invalid",
                extracted_at="2025-01-01T00:00:00Z",
            )


class TestUserProfile:
    def test_valid(self):
        p = _make_profile()
        assert p.return_comfort_level == 3

    def test_comfort_level_too_low(self):
        with pytest.raises(ValidationError):
            UserProfile(
                user_id="u1",
                memberships=[],
                student_status=None,
                payment_methods=[],
                return_comfort_level=0,
                citizenship_residency=None,
                cloud_sync_enabled=False,
                last_modified="2025-01-01T00:00:00Z",
            )

    def test_comfort_level_too_high(self):
        with pytest.raises(ValidationError):
            UserProfile(
                user_id="u1",
                memberships=[],
                student_status=None,
                payment_methods=[],
                return_comfort_level=6,
                citizenship_residency=None,
                cloud_sync_enabled=False,
                last_modified="2025-01-01T00:00:00Z",
            )

    def test_with_membership(self):
        m = Membership(
            provider="amazon_prime",
            active=True,
            renewal_date="2025-06-01T00:00:00Z",
            annual_cost=139.0,
        )
        p = UserProfile(
            user_id="u1",
            memberships=[m],
            student_status=None,
            payment_methods=[],
            return_comfort_level=3,
            citizenship_residency=None,
            cloud_sync_enabled=False,
            last_modified="2025-01-01T00:00:00Z",
        )
        assert len(p.memberships) == 1
        assert p.memberships[0].provider == "amazon_prime"


class TestPricingFactor:
    def test_valid(self):
        f = PricingFactor(
            name="volume_discount",
            classification="justified",
            weight=0.3,
            explanation="Bulk pricing",
        )
        assert f.weight == 0.3

    def test_weight_too_low(self):
        with pytest.raises(ValidationError):
            PricingFactor(
                name="x", classification="justified", weight=-0.1, explanation="x"
            )

    def test_weight_too_high(self):
        with pytest.raises(ValidationError):
            PricingFactor(
                name="x", classification="justified", weight=1.1, explanation="x"
            )


class TestCashbackCategory:
    def test_valid(self):
        c = CashbackCategory(category="groceries", percentage=3.0)
        assert c.percentage == 3.0

    def test_negative_percentage(self):
        with pytest.raises(ValidationError):
            CashbackCategory(category="groceries", percentage=-1.0)


class TestTECResponse:
    def test_round_trip(self):
        layer = _make_layer()
        verdict = _make_verdict()
        report = DecisionImpactReport(
            comparison_table=[],
            landscape_view=[],
            counterfactual_analysis=[],
            profile_comparison=[],
            fairness_verdict=verdict,
        )
        resp = TECResponse(
            product_name="Widget",
            listed_price=29.99,
            tec=34.0,
            currency="USD",
            layer_breakdown=layer,
            alternatives=[],
            alternatives_complete=True,
            decision_impact_report=report,
            fairness_verdict=verdict,
        )
        json_str = resp.model_dump_json()
        parsed = TECResponse.model_validate_json(json_str)
        assert parsed == resp


class TestErrorResponse:
    def test_valid(self):
        e = ErrorResponse(
            error=ErrorDetail(
                code="VALIDATION_ERROR",
                message="Bad request",
                details=[
                    ValidationErrorDetail(field="price", error="Must be positive")
                ],
            )
        )
        assert e.error.code == "VALIDATION_ERROR"
        assert len(e.error.details) == 1
