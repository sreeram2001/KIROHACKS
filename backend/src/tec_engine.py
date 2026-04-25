"""TrueCost Engine — TEC aggregation and alternatives generation."""

import logging

from models.product import ProductData
from models.profile import UserProfile
from models.tec import Alternative, CostLayerBreakdown

from cost_layers import (
    compute_risk_of_loss,
    compute_time_effort,
    compute_behavioral_pricing,
    compute_user_constraints,
    compute_path_effects,
)

logger = logging.getLogger(__name__)

# Try to import LLM engine; fall back gracefully
try:
    from llm_engine import analyze_hidden_costs_with_llm, find_real_alternatives_with_llm
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False


# ---------------------------------------------------------------------------
# TEC computation
# ---------------------------------------------------------------------------

def compute_tec(
    product: ProductData, profile: UserProfile
) -> tuple[float, CostLayerBreakdown]:
    """Compute the True Expected Cost for *product* given *profile*.

    Uses LLM-powered analysis when available, falls back to simulation.
    Returns (tec, layer_breakdown) where tec = listed_price + sum of all 5 cost layers.
    """
    if LLM_AVAILABLE:
        try:
            # Use simulation for cost layers (instant) — LLM only for alternatives
            breakdown = _simulate_breakdown(product, profile)
        except Exception:
            logger.warning("Simulation failed")
            breakdown = _simulate_breakdown(product, profile)
    else:
        breakdown = _simulate_breakdown(product, profile)

    tec = product.listed_price + (
        breakdown.risk_of_loss + breakdown.time_effort +
        breakdown.behavioral_pricing + breakdown.user_constraints +
        breakdown.path_effects
    )
    return tec, breakdown


def _simulate_breakdown(product: ProductData, profile: UserProfile) -> CostLayerBreakdown:
    """Fallback: compute cost layers using the simulation model."""
    return CostLayerBreakdown(
        risk_of_loss=compute_risk_of_loss(product, profile),
        time_effort=compute_time_effort(product, profile),
        behavioral_pricing=compute_behavioral_pricing(product, profile),
        user_constraints=compute_user_constraints(product, profile),
        path_effects=compute_path_effects(product, profile),
    )


# ---------------------------------------------------------------------------
# Alternatives generation helpers
# ---------------------------------------------------------------------------

_SELLER_VARIANTS: list[dict] = [
    {"seller": "Walmart", "platform_id": "walmart", "url_template": "https://www.walmart.com/search?q={query}"},
    {"seller": "Target", "platform_id": "target", "url_template": "https://www.target.com/s?searchTerm={query}"},
    {"seller": "Amazon", "platform_id": "amazon", "url_template": "https://www.amazon.com/s?k={query}"},
    {"seller": "Best Buy", "platform_id": "best_buy", "url_template": "https://www.bestbuy.com/site/searchpage.jsp?st={query}"},
    {"seller": "Costco", "platform_id": "costco", "url_template": "https://www.costco.com/CatalogSearch?keyword={query}"},
    {"seller": "eBay", "platform_id": "ebay", "url_template": "https://www.ebay.com/sch/i.html?_nkw={query}"},
]

# Price adjustment factors for simulated alternatives
_PRICE_ADJUSTMENTS = [0.92, 0.95, 0.97, 1.02, 0.90]


def _dominant_layer(breakdown: CostLayerBreakdown) -> str:
    """Return the name of the layer with the highest cost."""
    layers = {
        "risk_of_loss": breakdown.risk_of_loss,
        "time_effort": breakdown.time_effort,
        "behavioral_pricing": breakdown.behavioral_pricing,
        "user_constraints": breakdown.user_constraints,
        "path_effects": breakdown.path_effects,
    }
    return max(layers, key=layers.get)  # type: ignore[arg-type]


def _assign_badges(alternatives: list[Alternative]) -> list[Alternative]:
    """Assign exactly one badge per alternative based on dominant advantage.

    - "Best for you" → lowest TEC overall
    - "Lowest risk"  → lowest risk_of_loss
    - "Easiest return" → lowest time_effort

    Each badge is assigned to at most one alternative.  If there are more
    alternatives than badge types, extras get the badge of their dominant
    advantage from the remaining pool.
    """
    if not alternatives:
        return alternatives

    badge_pool = ["Best for you", "Lowest risk", "Easiest return"]
    assigned: dict[int, str] = {}

    # 1. Best for you → lowest TEC (already sorted, so index 0)
    assigned[0] = "Best for you"

    # 2. Lowest risk → lowest risk_of_loss among remaining
    remaining = [i for i in range(len(alternatives)) if i not in assigned]
    if remaining:
        best_risk_idx = min(remaining, key=lambda i: alternatives[i].layer_breakdown.risk_of_loss)
        assigned[best_risk_idx] = "Lowest risk"

    # 3. Easiest return → lowest time_effort among remaining
    remaining = [i for i in range(len(alternatives)) if i not in assigned]
    if remaining:
        best_effort_idx = min(remaining, key=lambda i: alternatives[i].layer_breakdown.time_effort)
        assigned[best_effort_idx] = "Easiest return"

    # Any remaining alternatives cycle through badges
    remaining = [i for i in range(len(alternatives)) if i not in assigned]
    cycle_badges = ["Best for you", "Lowest risk", "Easiest return"]
    for j, idx in enumerate(remaining):
        assigned[idx] = cycle_badges[j % len(cycle_badges)]

    result: list[Alternative] = []
    for i, alt in enumerate(alternatives):
        result.append(alt.model_copy(update={"badge": assigned[i]}))
    return result


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_alternatives(
    product: ProductData,
    profile: UserProfile,
    original_tec: float,
) -> tuple[list[Alternative], bool]:
    """Generate 3-5 alternatives with real URLs and prices via LLM.

    Falls back to simulated alternatives if LLM is unavailable.
    Returns (alternatives, alternatives_complete).
    """
    candidates: list[Alternative] = []

    # Try LLM-powered real alternatives
    if LLM_AVAILABLE:
        try:
            from llm_engine import find_real_alternatives_with_llm
            raw_alts = find_real_alternatives_with_llm(product, profile)
            for alt_data in raw_alts:
                try:
                    alt_price = float(alt_data.get("listed_price", 0))
                    if alt_price <= 0:
                        continue
                    alt_platform = alt_data.get("platform_id", "unknown")
                    alt_product = product.model_copy(update={
                        "seller": alt_data.get("seller", alt_platform),
                        "platform_id": alt_platform,
                        "listed_price": alt_price,
                        "page_url": alt_data.get("product_url", ""),
                    })
                    # Compute TEC for this alternative using simulation (fast)
                    alt_breakdown = _simulate_breakdown(alt_product, profile)
                    alt_tec = alt_price + (
                        alt_breakdown.risk_of_loss + alt_breakdown.time_effort +
                        alt_breakdown.behavioral_pricing + alt_breakdown.user_constraints +
                        alt_breakdown.path_effects
                    )
                    candidates.append(Alternative(
                        product_name=alt_data.get("product_name", product.product_name),
                        seller=alt_data.get("seller", alt_platform),
                        platform_id=alt_platform,
                        listed_price=alt_price,
                        tec=round(alt_tec, 2),
                        currency=product.currency,
                        badge="Best for you",
                        product_url=alt_data.get("product_url", ""),
                        layer_breakdown=alt_breakdown,
                        dominant_layer=_dominant_layer(alt_breakdown),
                    ))
                except Exception:
                    continue
        except Exception:
            logger.warning("LLM alternatives failed, using simulation fallback")

    # Fallback to simulated alternatives if LLM didn't produce enough
    if len(candidates) < 3:
        candidates.extend(_generate_simulated_alternatives(product, profile, len(candidates)))

    candidates.sort(key=lambda a: a.tec)
    candidates = candidates[:5]
    candidates = _assign_badges(candidates)
    alternatives_complete = len(candidates) >= 3
    return candidates, alternatives_complete


def _generate_simulated_alternatives(
    product: ProductData, profile: UserProfile, existing_count: int
) -> list[Alternative]:
    """Fallback: generate simulated alternatives."""
    candidates: list[Alternative] = []
    needed = 5 - existing_count

    for i, variant in enumerate(_SELLER_VARIANTS):
        if variant["platform_id"] == product.platform_id:
            continue
        if len(candidates) >= needed:
            break

        adj = _PRICE_ADJUSTMENTS[i % len(_PRICE_ADJUSTMENTS)]
        alt_price = round(product.listed_price * adj, 2)
        query = product.product_name.replace(" ", "+")
        alt_url = variant["url_template"].format(query=query)
        alt_product = product.model_copy(update={
            "seller": variant["seller"],
            "platform_id": variant["platform_id"],
            "listed_price": alt_price,
            "page_url": alt_url,
        })
        alt_breakdown = _simulate_breakdown(alt_product, profile)
        alt_tec = alt_price + (
            alt_breakdown.risk_of_loss + alt_breakdown.time_effort +
            alt_breakdown.behavioral_pricing + alt_breakdown.user_constraints +
            alt_breakdown.path_effects
        )
        candidates.append(Alternative(
            product_name=product.product_name,
            seller=variant["seller"],
            platform_id=variant["platform_id"],
            listed_price=alt_price,
            tec=round(alt_tec, 2),
            currency=product.currency,
            badge="Best for you",
            product_url=alt_product.page_url,
            layer_breakdown=alt_breakdown,
            dominant_layer=_dominant_layer(alt_breakdown),
        ))
    return candidates
