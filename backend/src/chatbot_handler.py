"""Strands Agent Lambda handler — chatbot endpoint."""

import json
import logging
import os
from typing import Any

from pydantic import ValidationError

from models.chat import ChatRequest, ChatResponse
from models.errors import ErrorDetail, ErrorResponse, ValidationErrorDetail

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# ---------------------------------------------------------------------------
# Strands SDK import — graceful fallback for testing environments
# ---------------------------------------------------------------------------
try:
    from strands import Agent
    from strands.models.bedrock import BedrockModel

    STRANDS_AVAILABLE = True
except ImportError:
    STRANDS_AVAILABLE = False
    Agent = None  # type: ignore[assignment,misc]
    BedrockModel = None  # type: ignore[assignment,misc]

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BEDROCK_MODEL_ID = os.environ.get(
    "BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-20250514"
)
BEDROCK_REGION = os.environ.get("BEDROCK_REGION", "us-east-1")

TRUECOST_CHATBOT_SYSTEM_PROMPT = """\
You are TrueCost, a personalized shopping advisor. You have deep knowledge of the user's \
financial profile and use it to give tailored advice that maximizes their savings.

## Your Capabilities
- Analyze the True Expected Cost (TEC) of products across 5 hidden cost layers: \
Risk of Loss, Time & Effort, Behavioral Pricing, User Constraints, and Path Effects.
- Recommend which payment card to use for maximum cashback on this specific purchase.
- Advise whether the user's memberships (Prime, Walmart+, etc.) provide benefits for this product.
- Factor in student/veteran/senior discounts when applicable.
- Suggest optimal timing, platform, and purchase strategy.

## How to Answer
- ALWAYS reference the user's specific cards, memberships, and statuses by name.
- ALWAYS calculate actual dollar savings when recommending a card or strategy.
- If the user has a card with cashback for this category, proactively mention it.
- If the user has a membership that helps with returns/shipping on this platform, say so.
- If the user is a student/veteran/senior, check if there are applicable discounts.
- Be specific: "Use your Chase Sapphire Preferred for 3% back ($2.97 on this $99 purchase)" \
not "consider using a rewards card."
- Keep answers concise but actionable.
- Reference the TEC data and cost layer values when relevant.
"""

# ---------------------------------------------------------------------------
# Tool context — populated per-request before agent invocation
# ---------------------------------------------------------------------------
_current_context: dict[str, Any] = {}


# ---------------------------------------------------------------------------
# Custom tools (decorated with @tool when strands is available)
# ---------------------------------------------------------------------------

def _make_tools():
    """Create tool functions. Returns a list of callables.

    When strands is available the functions are decorated with @tool.
    When strands is not available we return plain functions (useful for tests).
    """
    if STRANDS_AVAILABLE:
        from strands import tool as strands_tool
    else:
        # No-op decorator fallback
        def strands_tool(fn):
            return fn

    @strands_tool
    def lookup_tec_data() -> str:
        """Return the current TEC data for the product being viewed.

        Returns a JSON string with the product name, listed price, TEC value,
        currency, and full layer breakdown.
        """
        tec_data = _current_context.get("tec_data")
        product = _current_context.get("product_context")
        if tec_data is None:
            return json.dumps({"error": "No TEC data available for the current product."})
        result = {
            "product_name": product.product_name if product else "Unknown",
            "listed_price": product.listed_price if product else None,
            "tec": tec_data.tec,
            "currency": tec_data.currency,
            "layer_breakdown": tec_data.layer_breakdown.model_dump(),
        }
        return json.dumps(result)

    @strands_tool
    def explain_cost_layer(layer_name: str) -> str:
        """Explain what a specific cost layer means and its value for the current product.

        Args:
            layer_name: One of risk_of_loss, time_effort, behavioral_pricing,
                        user_constraints, or path_effects.
        """
        descriptions = {
            "risk_of_loss": (
                "Risk of Loss models the expected cost of refund denial, claim "
                "rejection, and warranty gaps. A higher value means the product "
                "carries more financial risk after purchase."
            ),
            "time_effort": (
                "Time & Effort Tax models the hours spent on hold, forms to fill, "
                "retry loops, and shipping logistics. It represents the hidden "
                "time cost of the purchase."
            ),
            "behavioral_pricing": (
                "Behavioral Pricing Dynamics models surge pricing, cart "
                "abandonment tricks, and loyalty penalties. It captures how "
                "seller tactics inflate the real cost."
            ),
            "user_constraints": (
                "User Constraints models urgency, platform lock-in, and payment "
                "method restrictions that limit your options and increase cost."
            ),
            "path_effects": (
                "Path Effects models renewals at higher rates, upgrade pressure, "
                "and compounding decisions that increase long-term cost."
            ),
        }
        tec_data = _current_context.get("tec_data")
        description = descriptions.get(layer_name, f"Unknown layer: {layer_name}")
        value = None
        if tec_data and hasattr(tec_data.layer_breakdown, layer_name):
            value = getattr(tec_data.layer_breakdown, layer_name)
        result = {
            "layer_name": layer_name,
            "description": description,
            "value": value,
            "currency": tec_data.currency if tec_data else None,
        }
        return json.dumps(result)

    @strands_tool
    def analyze_timing() -> str:
        """Analyze whether waiting would save money on the current product.

        Uses the Behavioral Pricing layer and available alternative timing data
        to advise on optimal purchase timing.
        """
        tec_data = _current_context.get("tec_data")
        if tec_data is None:
            return json.dumps({"error": "No TEC data available."})
        behavioral = tec_data.layer_breakdown.behavioral_pricing
        # Check alternatives for timing-based options
        timing_alternatives = []
        for alt in tec_data.alternatives:
            if alt.dominant_layer == "behavioral_pricing":
                timing_alternatives.append({
                    "product_name": alt.product_name,
                    "seller": alt.seller,
                    "tec": alt.tec,
                    "savings": round(tec_data.tec - alt.tec, 2),
                })
        result = {
            "behavioral_pricing_cost": behavioral,
            "current_tec": tec_data.tec,
            "timing_alternatives": timing_alternatives,
            "recommendation": (
                "Waiting may save money — behavioral pricing adds "
                f"${behavioral:.2f} to the current cost."
                if behavioral > 0
                else "Timing does not significantly affect the cost of this product."
            ),
        }
        return json.dumps(result)

    @strands_tool
    def compare_alternatives() -> str:
        """Compare the current product with its ranked alternatives.

        Returns a summary of all alternatives with their TEC, savings, and badges.
        """
        tec_data = _current_context.get("tec_data")
        product = _current_context.get("product_context")
        if tec_data is None:
            return json.dumps({"error": "No TEC data available."})
        comparisons = []
        for alt in tec_data.alternatives:
            comparisons.append({
                "product_name": alt.product_name,
                "seller": alt.seller,
                "listed_price": alt.listed_price,
                "tec": alt.tec,
                "savings": round(tec_data.tec - alt.tec, 2),
                "badge": alt.badge,
                "dominant_layer": alt.dominant_layer,
            })
        result = {
            "original_product": product.product_name if product else "Unknown",
            "original_tec": tec_data.tec,
            "alternatives": comparisons,
            "alternatives_complete": tec_data.alternatives_complete,
        }
        return json.dumps(result)

    return [lookup_tec_data, explain_cost_layer, analyze_timing, compare_alternatives]


# Build tools at module level
_tools = _make_tools()


# ---------------------------------------------------------------------------
# Agent factory
# ---------------------------------------------------------------------------

def _create_agent() -> Any:
    """Create and return a Strands Agent instance."""
    if not STRANDS_AVAILABLE:
        raise RuntimeError("strands-agents SDK is not installed")

    model = BedrockModel(
        model_id=BEDROCK_MODEL_ID,
        region_name=BEDROCK_REGION,
    )
    agent = Agent(
        model=model,
        system_prompt=TRUECOST_CHATBOT_SYSTEM_PROMPT,
        tools=_tools,
    )
    return agent


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_response(status_code: int, body: str) -> dict:
    """Build an API Gateway proxy response."""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
        },
        "body": body,
    }


def _validation_error_response(exc: ValidationError) -> dict:
    """Convert a Pydantic ValidationError into an HTTP 400 response."""
    details = []
    for err in exc.errors():
        field = ".".join(str(loc) for loc in err["loc"])
        details.append(ValidationErrorDetail(field=field, error=err["msg"]))
    error_resp = ErrorResponse(
        error=ErrorDetail(
            code="VALIDATION_ERROR",
            message="Request validation failed",
            details=details,
        )
    )
    return _build_response(400, error_resp.model_dump_json())


def _build_conversation_prompt(request: ChatRequest) -> str:
    """Build the full prompt with deep profile personalization."""
    parts: list[str] = []

    # --- Product context ---
    parts.append(
        f"## Current Product\n"
        f"- Product: {request.product_context.product_name}\n"
        f"- Listed price: ${request.product_context.listed_price:.2f} {request.product_context.currency}\n"
        f"- Seller: {request.product_context.seller}\n"
        f"- Platform: {request.product_context.platform_id}\n"
        f"- Page type: {request.product_context.page_type}"
    )

    # --- TEC data if available ---
    if request.tec_data:
        td = request.tec_data
        lb = td.layer_breakdown
        parts.append(
            f"\n## TEC Analysis\n"
            f"- True Expected Cost: ${td.tec:.2f}\n"
            f"- Hidden cost breakdown:\n"
            f"  - Risk of Loss: ${lb.risk_of_loss:.2f}\n"
            f"  - Time & Effort: ${lb.time_effort:.2f}\n"
            f"  - Behavioral Pricing: ${lb.behavioral_pricing:.2f}\n"
            f"  - User Constraints: ${lb.user_constraints:.2f}\n"
            f"  - Path Effects: ${lb.path_effects:.2f}\n"
            f"- Alternatives found: {len(td.alternatives)}"
        )
        if td.alternatives:
            alt_lines = []
            for alt in td.alternatives:
                alt_lines.append(f"  - {alt.seller}: ${alt.tec:.2f} TEC (save ${td.tec - alt.tec:.2f}) [{alt.badge}]")
            parts.append("- Best alternatives:\n" + "\n".join(alt_lines))

    # --- Deep profile context ---
    profile = request.user_profile
    parts.append("\n## User Profile")

    # Name
    name = getattr(profile, "display_name", None) or getattr(profile, "displayName", None) or ""
    if name:
        parts.append(f"- Name: {name}")

    # Memberships with details
    active_memberships = [m for m in profile.memberships if m.active]
    if active_memberships:
        mem_lines = []
        for m in active_memberships:
            renewal = f", renews {m.renewal_date}" if m.renewal_date else ""
            cost = f", ${m.annual_cost:.0f}/yr" if m.annual_cost else ""
            mem_lines.append(f"  - {m.provider.replace('_', ' ').title()}{cost}{renewal}")
        parts.append("- Active memberships:\n" + "\n".join(mem_lines))
        parts.append(
            "  → Use these to advise on: free shipping, easy returns, member pricing, "
            "and whether the membership is worth keeping based on this purchase."
        )
    else:
        parts.append("- No active memberships (suggest if one would help)")

    # Payment methods with cashback details
    if profile.payment_methods:
        card_lines = []
        for pm in profile.payment_methods:
            if pm.cashback_categories:
                cats = ", ".join(f"{c.percentage}% on {c.category.replace('_', ' ')}" for c in pm.cashback_categories)
                card_lines.append(f"  - {pm.name}: {cats}")
            else:
                card_lines.append(f"  - {pm.name}: no cashback categories set")
        parts.append("- Payment cards:\n" + "\n".join(card_lines))
        parts.append(
            "  → ALWAYS recommend which card to use for this specific purchase and "
            "calculate the exact cashback amount. Compare cards if multiple apply."
        )
    else:
        parts.append("- No payment cards on file")

    # Student status
    if profile.student_status and profile.student_status.verified:
        parts.append(f"- Student: VERIFIED ({profile.student_status.edu_email})")
        parts.append("  → Check for student discounts: UNiDAYS, Amazon Student, Apple Education, Spotify Student")
    else:
        parts.append("- Student: not verified")

    # Veteran / Senior
    is_veteran = getattr(profile, "is_veteran", False) or getattr(profile, "isVeteran", False)
    is_senior = getattr(profile, "is_senior_citizen", False) or getattr(profile, "isSeniorCitizen", False)
    if is_veteran:
        parts.append("- Veteran: YES → Check for military/veteran discounts (many retailers offer 10-15% off)")
    if is_senior:
        parts.append("- Senior Citizen: YES → Check for senior discounts (some retailers offer 5-10% off)")

    # Return comfort
    comfort_labels = {1: "avoids returns", 2: "reluctant", 3: "moderate", 4: "comfortable", 5: "very comfortable"}
    comfort = profile.return_comfort_level
    parts.append(f"- Return comfort: {comfort}/5 ({comfort_labels.get(comfort, 'unknown')})")
    if comfort <= 2:
        parts.append("  → User dislikes returns — prioritize low-risk options and easy return policies")
    elif comfort >= 4:
        parts.append("  → User is fine with returns — can suggest riskier but cheaper options")

    # Citizenship
    cr = profile.citizenship_residency
    if cr:
        parts.append(f"- Location: {cr.country}" + (f", {cr.region}" if cr.region else ""))

    # --- Conversation history ---
    if request.conversation_history:
        parts.append("\n## Conversation History")
        for msg in request.conversation_history:
            parts.append(f"{msg.role}: {msg.content}")

    # --- Current question ---
    parts.append(f"\n## User's Question\n{request.message}")

    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Lambda handler
# ---------------------------------------------------------------------------

def handler(event, context):
    """Lambda handler for POST /chat — conversational chatbot."""
    global _current_context

    # Parse body
    body_str = event.get("body", "")
    if not body_str:
        error_resp = ErrorResponse(
            error=ErrorDetail(
                code="VALIDATION_ERROR",
                message="Request body is empty",
                details=[
                    ValidationErrorDetail(field="body", error="Request body is required")
                ],
            )
        )
        return _build_response(400, error_resp.model_dump_json())

    try:
        payload = json.loads(body_str)
    except (json.JSONDecodeError, TypeError) as exc:
        error_resp = ErrorResponse(
            error=ErrorDetail(
                code="VALIDATION_ERROR",
                message="Invalid JSON in request body",
                details=[ValidationErrorDetail(field="body", error=str(exc))],
            )
        )
        return _build_response(400, error_resp.model_dump_json())

    # Validate against ChatRequest schema
    try:
        chat_request = ChatRequest.model_validate(payload)
    except ValidationError as exc:
        return _validation_error_response(exc)

    # Populate tool context for this request
    _current_context = {
        "product_context": chat_request.product_context,
        "tec_data": chat_request.tec_data,
        "user_profile": chat_request.user_profile,
    }

    # Check strands availability
    if not STRANDS_AVAILABLE:
        error_resp = ErrorResponse(
            error=ErrorDetail(
                code="SERVICE_UNAVAILABLE",
                message="Chatbot service is not available",
                details=[
                    ValidationErrorDetail(
                        field="strands", error="strands-agents SDK is not installed"
                    )
                ],
            )
        )
        return _build_response(503, error_resp.model_dump_json())

    # Invoke agent
    try:
        agent = _create_agent()
        prompt = _build_conversation_prompt(chat_request)
        result = agent(prompt)
        reply_text = str(result)

        # Collect sources from the TEC data
        sources: list[str] = []
        if chat_request.tec_data:
            sources.append(f"TEC: ${chat_request.tec_data.tec:.2f}")
            breakdown = chat_request.tec_data.layer_breakdown
            sources.append(f"Risk of Loss: ${breakdown.risk_of_loss:.2f}")
            sources.append(f"Time & Effort: ${breakdown.time_effort:.2f}")
            sources.append(f"Behavioral Pricing: ${breakdown.behavioral_pricing:.2f}")
            sources.append(f"User Constraints: ${breakdown.user_constraints:.2f}")
            sources.append(f"Path Effects: ${breakdown.path_effects:.2f}")

        chat_response = ChatResponse(reply=reply_text, sources=sources)
        return _build_response(200, chat_response.model_dump_json(by_alias=True))

    except Exception as exc:
        logger.exception("Bedrock invocation failed")
        error_resp = ErrorResponse(
            error=ErrorDetail(
                code="SERVICE_UNAVAILABLE",
                message="Chatbot temporarily unavailable",
                details=[
                    ValidationErrorDetail(
                        field="bedrock", error=str(exc)
                    )
                ],
            )
        )
        return _build_response(503, error_resp.model_dump_json())
