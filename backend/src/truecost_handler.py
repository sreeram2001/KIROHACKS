"""TrueCost Engine Lambda handler — TEC computation endpoint."""

import json
import logging
import os
from datetime import datetime, timezone

import boto3
from pydantic import ValidationError

from models.errors import ErrorDetail, ErrorResponse, ValidationErrorDetail
from models.ethics import PricingFactor
from models.tec import TECRequest, TECResponse
from tec_engine import compute_tec, generate_alternatives
from ethics_gate import evaluate_ethics
from report_builder import build_decision_impact_report

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

PROFILES_TABLE = os.environ.get("PROFILES_TABLE", "truecost-profiles")
DECISIONS_TABLE = os.environ.get("DECISIONS_TABLE", "truecost-decisions")

_dynamodb = None


def _get_dynamodb():
    """Lazy-init DynamoDB resource."""
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource("dynamodb")
    return _dynamodb


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


def _sanitize_for_dynamo(obj):
    """Recursively convert floats to strings for DynamoDB compatibility."""
    if isinstance(obj, float):
        return str(obj)
    if isinstance(obj, dict):
        return {k: _sanitize_for_dynamo(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize_for_dynamo(v) for v in obj]
    return obj


def _log_decision(user_id: str, product, tec: float, alternatives, verdict) -> None:
    """Log a decision and ethics verdict to DynamoDB."""
    try:
        dynamodb = _get_dynamodb()
        table = dynamodb.Table(DECISIONS_TABLE)
        best_alt_tec = alternatives[0].tec if alternatives else tec
        savings = round(tec - best_alt_tec, 2) if alternatives else 0.0
        item = _sanitize_for_dynamo({
            "userId": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "productName": product.product_name,
            "listedPrice": product.listed_price,
            "chosenTec": tec,
            "bestAlternativeTec": best_alt_tec,
            "savings": savings,
            "category": product.page_type,
            "platform": product.platform_id,
            "fairnessVerdict": verdict.verdict,
            "ethicsFactors": [f.model_dump() for f in verdict.factors],
        })
        table.put_item(Item=item)
    except Exception:
        logger.exception("Failed to log decision to DynamoDB")


def _log_profile(user_id: str, profile) -> None:
    """Log/update user profile to DynamoDB Profiles table."""
    try:
        dynamodb = _get_dynamodb()
        table = dynamodb.Table(PROFILES_TABLE)
        item = _sanitize_for_dynamo({
            "userId": user_id,
            "profile": profile.model_dump(),
            "lastModified": profile.last_modified,
        })
        table.put_item(Item=item)
    except Exception:
        logger.exception("Failed to log profile to DynamoDB")


def handler(event, context):
    """Lambda handler for POST /tec — compute TEC, alternatives, report."""
    # Parse body
    body_str = event.get("body", "")
    if not body_str:
        error_resp = ErrorResponse(
            error=ErrorDetail(
                code="VALIDATION_ERROR",
                message="Request body is empty",
                details=[ValidationErrorDetail(field="body", error="Request body is required")],
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

    # Validate against TECRequest schema
    try:
        tec_request = TECRequest.model_validate(payload)
    except ValidationError as exc:
        return _validation_error_response(exc)

    product = tec_request.product
    profile = tec_request.user_profile

    # 0. If price is 0, estimate it quickly
    if product.listed_price <= 0:
        try:
            from llm_engine import estimate_price_with_llm
            est = estimate_price_with_llm(product.product_name, product.platform_id)
            if est > 0:
                product = product.model_copy(update={"listed_price": est})
        except Exception:
            pass

    # 1. Compute TEC (LLM also estimates price if needed)
    tec, layer_breakdown = compute_tec(product, profile)
    tec = round(tec, 2)

    # 2. Generate alternatives
    alternatives, alternatives_complete = generate_alternatives(product, profile, tec)

    # 3. Evaluate ethics
    alt_prices = [a.listed_price for a in alternatives]
    pricing_factors = [
        PricingFactor(
            name="supply_and_demand",
            classification="justified",
            weight=0.3,
            explanation="Price varies by seller supply and demand dynamics",
        ),
    ]
    verdict = evaluate_ethics(product.listed_price, alt_prices, pricing_factors, product_id=product.page_url)

    # 4. If halted, return partial response
    if verdict.verdict == "halted":
        partial = {
            "productName": product.product_name,
            "listedPrice": product.listed_price,
            "tec": tec,
            "currency": product.currency,
            "layerBreakdown": layer_breakdown.model_dump(by_alias=True),
            "alternatives": [],
            "alternativesComplete": False,
            "fairnessVerdict": verdict.model_dump(by_alias=True),
            "halted": True,
            "haltReason": verdict.explanation,
        }
        _log_decision(profile.user_id, product, tec, [], verdict)
        return _build_response(200, json.dumps(partial))

    # 5. Build Decision Impact Report
    report = build_decision_impact_report(
        product, profile, tec, layer_breakdown, alternatives, verdict
    )

    # 6. Build full response
    tec_response = TECResponse(
        product_name=product.product_name,
        listed_price=product.listed_price,
        tec=tec,
        currency=product.currency,
        layer_breakdown=layer_breakdown,
        alternatives=alternatives,
        alternatives_complete=alternatives_complete,
        decision_impact_report=report,
        fairness_verdict=verdict,
    )

    # 7. Log decision and profile to DynamoDB
    _log_decision(profile.user_id, product, tec, alternatives, verdict)
    _log_profile(profile.user_id, profile)

    return _build_response(200, tec_response.model_dump_json(by_alias=True))
