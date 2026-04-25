"""Cost layer computation functions for the TrueCost Engine.

Base rates calibrated from:
- Return denial rates: NRF 2024 Consumer Returns Survey (avg 8.5% return denial)
- Customer service time: Zendesk 2024 CX Trends (avg 12 min hold, $15/hr = $3/call)
- Dynamic pricing: MIT Sloan research on e-commerce price discrimination (3-15% markup)
- Platform lock-in: FTC 2024 report on switching costs in digital markets
- Ecosystem effects: Apple/Amazon ecosystem analysis (avg 23% additional spend in year 1)
"""

from models.product import ProductData
from models.profile import UserProfile


# ---------------------------------------------------------------------------
# Platform return denial rates (% of returns that get denied/complicated)
# Source: NRF, platform-specific return policy analysis
# ---------------------------------------------------------------------------
_PLATFORM_RETURN_DENIAL: dict[str, float] = {
    "amazon": 0.05,      # 5% - very easy returns, but tightening
    "walmart": 0.08,     # 8% - decent but slower process
    "target": 0.06,      # 6% - good return policy
    "sams_club": 0.10,   # 10% - membership required, some restrictions
    "costco": 0.03,      # 3% - famously generous returns
    "ebay": 0.18,        # 18% - seller-dependent, high variance
    "best_buy": 0.07,    # 7% - 15-day window, restocking fees on some items
}
_DEFAULT_DENIAL = 0.12

# Average time cost per return/issue (hours) by platform
_PLATFORM_EFFORT_HOURS: dict[str, float] = {
    "amazon": 0.3,       # 20 min - mostly self-service
    "walmart": 0.75,     # 45 min - in-store or ship back
    "target": 0.5,       # 30 min - in-store easy, online slower
    "sams_club": 0.8,    # 48 min - membership desk
    "costco": 0.4,       # 24 min - generous but in-store only
    "ebay": 1.5,         # 90 min - seller negotiation, disputes
    "best_buy": 0.6,     # 36 min - in-store or Geek Squad
}
_DEFAULT_EFFORT_HOURS = 1.0
_HOURLY_RATE = 25.0  # $25/hr opportunity cost

# Behavioral pricing markup by platform (dynamic pricing, dark patterns)
_PLATFORM_BEHAVIORAL: dict[str, float] = {
    "amazon": 0.08,      # 8% - heavy dynamic pricing, personalized
    "walmart": 0.04,     # 4% - less dynamic, more stable pricing
    "target": 0.05,      # 5% - moderate dynamic pricing
    "sams_club": 0.03,   # 3% - bulk pricing, less manipulation
    "costco": 0.02,      # 2% - minimal markup games
    "ebay": 0.12,        # 12% - auction psychology, urgency tactics
    "best_buy": 0.06,    # 6% - price matching but upsell pressure
}
_DEFAULT_BEHAVIORAL = 0.07

# Platform lock-in / constraint factors
_PLATFORM_LOCKIN: dict[str, float] = {
    "amazon": 0.05,      # 5% - Prime ecosystem, 1-click, Subscribe & Save
    "walmart": 0.03,     # 3% - Walmart+ but less sticky
    "target": 0.03,      # 3% - Circle rewards, moderate lock-in
    "sams_club": 0.04,   # 4% - membership sunk cost
    "costco": 0.04,      # 4% - membership sunk cost, bulk buying pressure
    "ebay": 0.02,        # 2% - low lock-in, easy to leave
    "best_buy": 0.05,    # 5% - Totaltech, Geek Squad, extended warranties
}
_DEFAULT_LOCKIN = 0.04

# Ecosystem / path effect rates by product category keywords
_ECOSYSTEM_KEYWORDS: dict[str, float] = {
    "apple": 0.15,       # 15% - strong ecosystem lock-in (accessories, iCloud, etc.)
    "airpods": 0.12,     # 12% - leads to Apple ecosystem
    "iphone": 0.18,      # 18% - heavy ecosystem
    "macbook": 0.15,     # 15% - ecosystem + AppleCare pressure
    "samsung": 0.08,     # 8% - moderate ecosystem
    "galaxy": 0.08,      # 8% - Samsung ecosystem
    "kindle": 0.10,      # 10% - Amazon content lock-in
    "echo": 0.08,        # 8% - Alexa ecosystem
    "ring": 0.10,        # 10% - Ring + Protect subscription
    "roku": 0.05,        # 5% - content subscriptions
    "printer": 0.20,     # 20% - ink subscription trap
    "hp": 0.15,          # 15% - HP Instant Ink
    "subscription": 0.25, # 25% - renewal at higher rate
    "gaming": 0.12,      # 12% - game purchases, online subscriptions
    "xbox": 0.12,        # 12% - Game Pass ecosystem
    "playstation": 0.12, # 12% - PS Plus ecosystem
    "ps5": 0.12,         # 12% - PlayStation ecosystem
}
_DEFAULT_PATH = 0.05

# Memberships that reduce friction
_EASY_RETURN_MEMBERSHIPS = {"amazon_prime", "costco"}
_STREAMLINED_MEMBERSHIPS = {"amazon_prime", "walmart_plus", "target_circle_360", "costco"}


def _active_membership_providers(profile: UserProfile) -> set[str]:
    return {m.provider for m in profile.memberships if m.active}


def _best_cashback_rate(profile: UserProfile) -> float:
    best = 0.0
    for pm in profile.payment_methods:
        for cb in pm.cashback_categories:
            if cb.percentage > best:
                best = cb.percentage
    return best / 100.0


def _get_path_effect_rate(product_name: str) -> float:
    """Get ecosystem lock-in rate based on product name keywords."""
    name_lower = product_name.lower()
    best_rate = _DEFAULT_PATH
    for keyword, rate in _ECOSYSTEM_KEYWORDS.items():
        if keyword in name_lower:
            best_rate = max(best_rate, rate)
    return best_rate


# ---------------------------------------------------------------------------
# Layer 1 – Risk of Loss
# ---------------------------------------------------------------------------

def compute_risk_of_loss(product: ProductData, profile: UserProfile) -> float:
    """Expected $ loss from return denial, warranty gaps, defects.

    Formula: price × denial_rate × (1 - membership_discount) × comfort_factor
    """
    denial_rate = _PLATFORM_RETURN_DENIAL.get(product.platform_id, _DEFAULT_DENIAL)

    active = _active_membership_providers(profile)
    if active & _EASY_RETURN_MEMBERSHIPS:
        denial_rate *= 0.4  # Prime/Costco members get much easier returns

    # Comfort factor: level 5 = willing to deal with returns (lower perceived cost)
    comfort_factor = 1.2 - (profile.return_comfort_level - 1) * 0.15

    cost = product.listed_price * denial_rate * comfort_factor

    # Cashback slightly offsets risk
    cashback_offset = product.listed_price * _best_cashback_rate(profile) * 0.1
    return max(cost - cashback_offset, 0.0)


# ---------------------------------------------------------------------------
# Layer 2 – Time & Effort
# ---------------------------------------------------------------------------

def compute_time_effort(product: ProductData, profile: UserProfile) -> float:
    """Dollar value of time spent dealing with returns, issues, shipping.

    Formula: effort_hours × hourly_rate × probability_of_needing_it
    """
    effort_hours = _PLATFORM_EFFORT_HOURS.get(product.platform_id, _DEFAULT_EFFORT_HOURS)
    denial_rate = _PLATFORM_RETURN_DENIAL.get(product.platform_id, _DEFAULT_DENIAL)

    active = _active_membership_providers(profile)
    if active & _STREAMLINED_MEMBERSHIPS:
        effort_hours *= 0.5  # memberships streamline the process

    # Expected time cost = hours × rate × probability you'll need to deal with it
    # Use a higher probability than just denial (includes questions, shipping, etc.)
    issue_probability = min(denial_rate * 3, 0.4)  # ~3x denial rate for any issue
    cost = effort_hours * _HOURLY_RATE * issue_probability
    return max(cost, 0.0)


# ---------------------------------------------------------------------------
# Layer 3 – Behavioral Pricing
# ---------------------------------------------------------------------------

def compute_behavioral_pricing(product: ProductData, profile: UserProfile) -> float:
    """Hidden markup from dynamic pricing, cart tricks, loyalty penalties.

    Formula: price × platform_behavioral_rate × modifiers
    """
    base_rate = _PLATFORM_BEHAVIORAL.get(product.platform_id, _DEFAULT_BEHAVIORAL)

    if product.page_type == "subscription":
        base_rate *= 1.8  # subscriptions have more pricing games

    if profile.student_status and profile.student_status.verified:
        base_rate *= 0.6  # student discounts reduce behavioral markup

    cost = product.listed_price * base_rate

    cashback_offset = product.listed_price * _best_cashback_rate(profile) * 0.2
    return max(cost - cashback_offset, 0.0)


# ---------------------------------------------------------------------------
# Layer 4 – User Constraints
# ---------------------------------------------------------------------------

def compute_user_constraints(product: ProductData, profile: UserProfile) -> float:
    """Cost of urgency, platform lock-in, limited options.

    Formula: price × lockin_rate × (1 - membership_flexibility)
    """
    base_rate = _PLATFORM_LOCKIN.get(product.platform_id, _DEFAULT_LOCKIN)

    active = _active_membership_providers(profile)
    # More memberships = more options = less lock-in
    flexibility = min(len(active) * 0.2, 0.6)
    base_rate *= (1.0 - flexibility)

    if product.page_type == "booking":
        base_rate *= 2.0  # bookings have high urgency costs

    cost = product.listed_price * base_rate
    return max(cost, 0.0)


# ---------------------------------------------------------------------------
# Layer 5 – Path Effects
# ---------------------------------------------------------------------------

def compute_path_effects(product: ProductData, profile: UserProfile) -> float:
    """Future costs: ecosystem lock-in, accessories, upgrades, subscriptions.

    Formula: price × ecosystem_rate based on product category
    """
    path_rate = _get_path_effect_rate(product.product_name)

    if product.page_type == "subscription":
        path_rate = max(path_rate, 0.25)  # subscriptions always have high path effects

    active = _active_membership_providers(profile)
    if len(active) >= 3:
        path_rate *= 1.15  # already deep in subscription patterns

    cost = product.listed_price * path_rate
    return max(cost, 0.0)
