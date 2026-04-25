"""Decision Impact Report builder."""

from models.product import ProductData
from models.profile import Membership, UserProfile
from models.ethics import FairnessVerdict
from models.tec import (
    Alternative,
    ComparisonRow,
    CostLayerBreakdown,
    CounterfactualResult,
    DecisionImpactReport,
    ProfileComparisonResult,
    ScenarioVariation,
)
from tec_engine import compute_tec


def _dominant_layer(breakdown: CostLayerBreakdown) -> str:
    layers = {
        "risk_of_loss": breakdown.risk_of_loss,
        "time_effort": breakdown.time_effort,
        "behavioral_pricing": breakdown.behavioral_pricing,
        "user_constraints": breakdown.user_constraints,
        "path_effects": breakdown.path_effects,
    }
    return max(layers, key=layers.get)  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# Comparison table
# ---------------------------------------------------------------------------

def _build_comparison_table(
    product: ProductData,
    tec: float,
    layer_breakdown: CostLayerBreakdown,
    alternatives: list[Alternative],
) -> list[ComparisonRow]:
    """Build comparison table: 1 original + N alternatives."""
    rows: list[ComparisonRow] = [
        ComparisonRow(
            product_name=product.product_name,
            seller=product.seller,
            listed_price=product.listed_price,
            tec=tec,
            dominant_layer=_dominant_layer(layer_breakdown),
            is_original=True,
        )
    ]
    for alt in alternatives:
        rows.append(
            ComparisonRow(
                product_name=alt.product_name,
                seller=alt.seller,
                listed_price=alt.listed_price,
                tec=alt.tec,
                dominant_layer=alt.dominant_layer,
                is_original=False,
            )
        )
    return rows


# ---------------------------------------------------------------------------
# Landscape view (>= 3 scenario variations)
# ---------------------------------------------------------------------------

def _build_landscape_view(
    product: ProductData,
    profile: UserProfile,
    tec: float,
) -> list[ScenarioVariation]:
    """Generate >= 3 scenario variations: timing, platform, behaviour."""
    scenarios: list[ScenarioVariation] = []

    # Scenario 1 – Timing: buy next week (assume 5% price drop)
    timing_price = round(product.listed_price * 0.95, 2)
    timing_product = product.model_copy(update={"listed_price": timing_price})
    timing_tec, _ = compute_tec(timing_product, profile)
    scenarios.append(
        ScenarioVariation(
            scenario_name="Buy next week",
            variable_changed="timing",
            adjusted_tec=round(timing_tec, 2),
            delta_from_current=round(timing_tec - tec, 2),
        )
    )

    # Scenario 2 – Platform: switch to a different platform
    alt_platform = "walmart" if product.platform_id != "walmart" else "target"
    platform_product = product.model_copy(update={"platform_id": alt_platform})
    platform_tec, _ = compute_tec(platform_product, profile)
    scenarios.append(
        ScenarioVariation(
            scenario_name=f"Buy on {alt_platform.replace('_', ' ').title()}",
            variable_changed="platform",
            adjusted_tec=round(platform_tec, 2),
            delta_from_current=round(platform_tec - tec, 2),
        )
    )

    # Scenario 3 – Behaviour: increase return comfort to max
    if profile.return_comfort_level < 5:
        comfort_profile = profile.model_copy(update={"return_comfort_level": 5})
    else:
        comfort_profile = profile.model_copy(update={"return_comfort_level": 1})
    behavior_tec, _ = compute_tec(product, comfort_profile)
    scenarios.append(
        ScenarioVariation(
            scenario_name="Adjust return comfort level",
            variable_changed="behavior",
            adjusted_tec=round(behavior_tec, 2),
            delta_from_current=round(behavior_tec - tec, 2),
        )
    )

    return scenarios


# ---------------------------------------------------------------------------
# Counterfactual analysis
# ---------------------------------------------------------------------------

def _build_counterfactual(
    original_tec: float,
    alternatives: list[Alternative],
) -> list[CounterfactualResult]:
    """savings_or_cost = original_tec - alternative_tec for each."""
    return [
        CounterfactualResult(
            alternative_name=f"{alt.product_name} ({alt.seller})",
            savings_or_cost=round(original_tec - alt.tec, 2),
        )
        for alt in alternatives
    ]


# ---------------------------------------------------------------------------
# Profile comparison (>= 2 hypothetical profiles)
# ---------------------------------------------------------------------------

def _build_profile_comparison(
    product: ProductData,
    profile: UserProfile,
    tec: float,
) -> list[ProfileComparisonResult]:
    """Compare TEC for >= 2 hypothetical user profiles."""
    results: list[ProfileComparisonResult] = []

    # Hypothetical 1: Prime member with student discount
    hypo1 = profile.model_copy(
        update={
            "memberships": [
                Membership(
                    provider="amazon_prime",
                    active=True,
                    renewal_date=None,
                    annual_cost=139.0,
                )
            ],
            "student_status": profile.student_status
            or None,  # keep existing or None
            "return_comfort_level": 4,
        }
    )
    tec1, _ = compute_tec(product, hypo1)
    results.append(
        ProfileComparisonResult(
            profile_label="Prime member (comfort 4)",
            memberships=["amazon_prime"],
            payment_methods=[pm.name for pm in hypo1.payment_methods],
            tec=round(tec1, 2),
            delta_from_user=round(tec1 - tec, 2),
        )
    )

    # Hypothetical 2: No memberships, no discounts
    hypo2 = profile.model_copy(
        update={
            "memberships": [],
            "student_status": None,
            "payment_methods": [],
            "return_comfort_level": 2,
        }
    )
    tec2, _ = compute_tec(product, hypo2)
    results.append(
        ProfileComparisonResult(
            profile_label="No memberships or discounts",
            memberships=[],
            payment_methods=[],
            tec=round(tec2, 2),
            delta_from_user=round(tec2 - tec, 2),
        )
    )

    return results


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_decision_impact_report(
    product: ProductData,
    profile: UserProfile,
    tec: float,
    layer_breakdown: CostLayerBreakdown,
    alternatives: list[Alternative],
    verdict: FairnessVerdict,
) -> DecisionImpactReport:
    """Build the full Decision Impact Report."""
    return DecisionImpactReport(
        comparison_table=_build_comparison_table(product, tec, layer_breakdown, alternatives),
        landscape_view=_build_landscape_view(product, profile, tec),
        counterfactual_analysis=_build_counterfactual(tec, alternatives),
        profile_comparison=_build_profile_comparison(product, profile, tec),
        fairness_verdict=verdict,
    )
