"""Ethics Gate module — classifies pricing factors and produces Fairness Verdicts."""

from datetime import datetime, timezone

from models.ethics import FairnessVerdict, PricingFactor

# Factors classified as justified pricing practices
JUSTIFIED_FACTORS: set[str] = {
    "volume_discount",
    "volume_discounts",
    "shipping_distance",
    "shipping_distance_based_pricing",
    "actuarial_risk",
    "actuarial_risk_based_pricing",
    "risk_based_pricing",
    "supply_and_demand",
    "supply_demand",
}

# Factors classified as unjustified pricing practices
UNJUSTIFIED_FACTORS: set[str] = {
    "location_as_income_proxy",
    "location_income_proxy",
    "dark_patterns",
    "dark_pattern",
    "demographic_pricing",
    "demographic_pricing_without_actuarial_basis",
    "demographic_based_pricing",
}


def classify_factor(factor_name: str) -> str:
    """Classify a pricing factor name as 'justified' or 'unjustified'.

    Known justified factors: volume discounts, shipping distance,
    actuarial risk-based pricing, supply-and-demand.

    Known unjustified factors: location as income proxy, dark patterns,
    demographic pricing without actuarial basis.

    Unknown factors default to 'unjustified' (precautionary principle).
    """
    normalized = factor_name.strip().lower().replace("-", "_").replace(" ", "_")
    if normalized in JUSTIFIED_FACTORS:
        return "justified"
    if normalized in UNJUSTIFIED_FACTORS:
        return "unjustified"
    # Unknown factors are treated as unjustified by default (precautionary)
    return "unjustified"


def evaluate_ethics(
    original_price: float,
    alternative_prices: list[float],
    pricing_factors: list[PricingFactor],
    product_id: str = "unknown",
) -> FairnessVerdict:
    """Evaluate pricing factors and produce a Fairness Verdict.

    Classification rules:
      - Justified: volume discounts, shipping distance, actuarial risk, supply-demand
      - Unjustified: location as income proxy, dark patterns, demographic pricing

    Verdict logic:
      - All justified → "clean"
      - Some unjustified but sum of unjustified weights ≤ 0.5 → "flagged" + explanation
      - Sum of unjustified weights > 0.5 → "halted"
    """
    # Classify each factor
    classified_factors: list[PricingFactor] = []
    for factor in pricing_factors:
        classification = classify_factor(factor.name)
        classified_factors.append(
            PricingFactor(
                name=factor.name,
                classification=classification,
                weight=factor.weight,
                explanation=factor.explanation,
            )
        )

    # Compute sum of unjustified factor weights
    unjustified_weight_sum = sum(
        f.weight for f in classified_factors if f.classification == "unjustified"
    )

    has_unjustified = any(
        f.classification == "unjustified" for f in classified_factors
    )

    # Determine verdict
    timestamp = datetime.now(timezone.utc).isoformat()

    if not has_unjustified:
        return FairnessVerdict(
            verdict="clean",
            factors=classified_factors,
            explanation=None,
            timestamp=timestamp,
            product_id=product_id,
        )

    if unjustified_weight_sum <= 0.5:
        unjustified_names = [
            f.name for f in classified_factors if f.classification == "unjustified"
        ]
        explanation = (
            f"Flagged unjustified pricing factors: {', '.join(unjustified_names)}. "
            f"Combined unjustified weight: {unjustified_weight_sum:.2f}."
        )
        return FairnessVerdict(
            verdict="flagged",
            factors=classified_factors,
            explanation=explanation,
            timestamp=timestamp,
            product_id=product_id,
        )

    # unjustified_weight_sum > 0.5 → halted
    unjustified_names = [
        f.name for f in classified_factors if f.classification == "unjustified"
    ]
    explanation = (
        f"Analysis halted — unjustified pricing factors dominate: "
        f"{', '.join(unjustified_names)}. "
        f"Combined unjustified weight: {unjustified_weight_sum:.2f}."
    )
    return FairnessVerdict(
        verdict="halted",
        factors=classified_factors,
        explanation=explanation,
        timestamp=timestamp,
        product_id=product_id,
    )
