"""Tests for Ethics Gate classification and verdict logic."""

import pytest
from datetime import datetime

from models.ethics import PricingFactor, FairnessVerdict
from ethics_gate import classify_factor, evaluate_ethics


class TestClassifyFactor:
    """Test the classify_factor helper."""

    @pytest.mark.parametrize(
        "name",
        [
            "volume_discount",
            "volume_discounts",
            "shipping_distance",
            "actuarial_risk",
            "actuarial_risk_based_pricing",
            "risk_based_pricing",
            "supply_and_demand",
            "supply_demand",
            "shipping_distance_based_pricing",
        ],
    )
    def test_justified_factors(self, name: str):
        assert classify_factor(name) == "justified"

    @pytest.mark.parametrize(
        "name",
        [
            "location_as_income_proxy",
            "location_income_proxy",
            "dark_patterns",
            "dark_pattern",
            "demographic_pricing",
            "demographic_pricing_without_actuarial_basis",
            "demographic_based_pricing",
        ],
    )
    def test_unjustified_factors(self, name: str):
        assert classify_factor(name) == "unjustified"

    def test_unknown_factor_defaults_to_unjustified(self):
        assert classify_factor("mystery_factor") == "unjustified"

    def test_normalizes_spaces_and_hyphens(self):
        assert classify_factor("volume discount") == "justified"
        assert classify_factor("volume-discount") == "justified"
        assert classify_factor("dark patterns") == "unjustified"

    def test_case_insensitive(self):
        assert classify_factor("Volume_Discount") == "justified"
        assert classify_factor("DARK_PATTERNS") == "unjustified"


class TestEvaluateEthicsClean:
    """Verdict should be 'clean' when all factors are justified."""

    def test_all_justified(self):
        factors = [
            PricingFactor(
                name="volume_discount",
                classification="justified",
                weight=0.4,
                explanation="Bulk pricing",
            ),
            PricingFactor(
                name="shipping_distance",
                classification="justified",
                weight=0.3,
                explanation="Distance-based shipping",
            ),
        ]
        verdict = evaluate_ethics(100.0, [90.0, 95.0], factors, product_id="p1")
        assert verdict.verdict == "clean"
        assert verdict.explanation is None
        assert verdict.product_id == "p1"
        assert len(verdict.factors) == 2
        assert all(f.classification == "justified" for f in verdict.factors)

    def test_empty_factors_is_clean(self):
        verdict = evaluate_ethics(100.0, [90.0], [], product_id="p2")
        assert verdict.verdict == "clean"
        assert verdict.explanation is None


class TestEvaluateEthicsFlagged:
    """Verdict should be 'flagged' when unjustified weight sum ≤ 0.5."""

    def test_some_unjustified_low_weight(self):
        factors = [
            PricingFactor(
                name="volume_discount",
                classification="justified",
                weight=0.6,
                explanation="Bulk pricing",
            ),
            PricingFactor(
                name="dark_patterns",
                classification="unjustified",
                weight=0.3,
                explanation="Manipulative UI",
            ),
        ]
        verdict = evaluate_ethics(100.0, [90.0], factors, product_id="p3")
        assert verdict.verdict == "flagged"
        assert verdict.explanation is not None
        assert "dark_patterns" in verdict.explanation

    def test_unjustified_weight_exactly_0_5(self):
        factors = [
            PricingFactor(
                name="dark_patterns",
                classification="unjustified",
                weight=0.5,
                explanation="Manipulative UI",
            ),
        ]
        verdict = evaluate_ethics(100.0, [90.0], factors, product_id="p4")
        assert verdict.verdict == "flagged"


class TestEvaluateEthicsHalted:
    """Verdict should be 'halted' when unjustified weight sum > 0.5."""

    def test_unjustified_dominant(self):
        factors = [
            PricingFactor(
                name="location_as_income_proxy",
                classification="unjustified",
                weight=0.6,
                explanation="Zip-code pricing",
            ),
        ]
        verdict = evaluate_ethics(100.0, [90.0], factors, product_id="p5")
        assert verdict.verdict == "halted"
        assert verdict.explanation is not None
        assert "location_as_income_proxy" in verdict.explanation

    def test_multiple_unjustified_exceeding_threshold(self):
        factors = [
            PricingFactor(
                name="dark_patterns",
                classification="unjustified",
                weight=0.3,
                explanation="Manipulative UI",
            ),
            PricingFactor(
                name="demographic_pricing",
                classification="unjustified",
                weight=0.3,
                explanation="Age-based pricing",
            ),
        ]
        verdict = evaluate_ethics(100.0, [90.0], factors, product_id="p6")
        assert verdict.verdict == "halted"


class TestEvaluateEthicsTimestamp:
    """Verdict should include a valid ISO 8601 timestamp."""

    def test_timestamp_is_iso8601(self):
        verdict = evaluate_ethics(100.0, [90.0], [], product_id="p7")
        # Should parse without error
        datetime.fromisoformat(verdict.timestamp)


class TestEvaluateEthicsReclassifies:
    """evaluate_ethics should reclassify factors based on its own rules,
    regardless of the classification passed in."""

    def test_reclassifies_misclassified_factor(self):
        # Pass a factor marked justified that should be unjustified
        factors = [
            PricingFactor(
                name="dark_patterns",
                classification="justified",  # wrong
                weight=0.8,
                explanation="Manipulative UI",
            ),
        ]
        verdict = evaluate_ethics(100.0, [90.0], factors, product_id="p8")
        # The gate should reclassify it as unjustified → halted
        assert verdict.verdict == "halted"
        assert verdict.factors[0].classification == "unjustified"
