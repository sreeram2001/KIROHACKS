"""Profile CRUD and decision history Lambda handlers."""

import json
import logging
import os

import boto3
from pydantic import ValidationError

from models.errors import ErrorDetail, ErrorResponse, ValidationErrorDetail
from models.profile import UserProfile

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


def _extract_user_id(event: dict) -> str | None:
    """Extract userId from API Gateway path parameters."""
    path_params = event.get("pathParameters") or {}
    return path_params.get("userId")


# ---------------------------------------------------------------------------
# GET /profile/{userId}
# ---------------------------------------------------------------------------

def get_profile(event, context):
    """Read a user profile from DynamoDB."""
    user_id = _extract_user_id(event)
    if not user_id:
        error_resp = ErrorResponse(
            error=ErrorDetail(
                code="VALIDATION_ERROR",
                message="Missing userId path parameter",
                details=[ValidationErrorDetail(field="userId", error="userId is required")],
            )
        )
        return _build_response(400, error_resp.model_dump_json())

    try:
        dynamodb = _get_dynamodb()
        table = dynamodb.Table(PROFILES_TABLE)
        result = table.get_item(Key={"userId": user_id})
    except Exception:
        logger.exception("DynamoDB read failed")
        return _build_response(500, json.dumps({"error": {"code": "INTERNAL_ERROR", "message": "Failed to read profile"}}))

    item = result.get("Item")
    if not item:
        return _build_response(404, json.dumps({"error": {"code": "NOT_FOUND", "message": f"Profile not found for userId: {user_id}"}}))

    return _build_response(200, json.dumps(item, default=str))


# ---------------------------------------------------------------------------
# PUT /profile/{userId}
# ---------------------------------------------------------------------------

def put_profile(event, context):
    """Write/update a user profile in DynamoDB."""
    user_id = _extract_user_id(event)
    if not user_id:
        error_resp = ErrorResponse(
            error=ErrorDetail(
                code="VALIDATION_ERROR",
                message="Missing userId path parameter",
                details=[ValidationErrorDetail(field="userId", error="userId is required")],
            )
        )
        return _build_response(400, error_resp.model_dump_json())

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

    # Validate against UserProfile schema
    try:
        profile = UserProfile.model_validate(payload)
    except ValidationError as exc:
        return _validation_error_response(exc)

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
        logger.exception("DynamoDB write failed")
        return _build_response(500, json.dumps({"error": {"code": "INTERNAL_ERROR", "message": "Failed to write profile"}}))

    return _build_response(200, json.dumps({"message": "Profile saved", "userId": user_id}))


# ---------------------------------------------------------------------------
# GET /decisions/{userId}
# ---------------------------------------------------------------------------

def get_decisions(event, context):
    """Read decision history for a user from DynamoDB."""
    user_id = _extract_user_id(event)
    if not user_id:
        error_resp = ErrorResponse(
            error=ErrorDetail(
                code="VALIDATION_ERROR",
                message="Missing userId path parameter",
                details=[ValidationErrorDetail(field="userId", error="userId is required")],
            )
        )
        return _build_response(400, error_resp.model_dump_json())

    try:
        dynamodb = _get_dynamodb()
        table = dynamodb.Table(DECISIONS_TABLE)
        result = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(user_id)
        )
    except Exception:
        logger.exception("DynamoDB query failed")
        return _build_response(500, json.dumps({"error": {"code": "INTERNAL_ERROR", "message": "Failed to read decisions"}}))

    items = result.get("Items", [])
    return _build_response(200, json.dumps(items, default=str))


# ---------------------------------------------------------------------------
# POST /decisions/{userId}
# ---------------------------------------------------------------------------

def post_decision(event, context):
    """Write a decision record to DynamoDB."""
    user_id = _extract_user_id(event)
    if not user_id:
        error_resp = ErrorResponse(
            error=ErrorDetail(
                code="VALIDATION_ERROR",
                message="Missing userId path parameter",
                details=[ValidationErrorDetail(field="userId", error="userId is required")],
            )
        )
        return _build_response(400, error_resp.model_dump_json())

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

    # Validate required fields for a decision record
    required_fields = ["productName", "listedPrice", "chosenTec", "platform", "fairnessVerdict"]
    missing = [f for f in required_fields if f not in payload]
    if missing:
        details = [ValidationErrorDetail(field=f, error=f"{f} is required") for f in missing]
        error_resp = ErrorResponse(
            error=ErrorDetail(
                code="VALIDATION_ERROR",
                message="Missing required fields",
                details=details,
            )
        )
        return _build_response(400, error_resp.model_dump_json())

    try:
        from datetime import datetime, timezone

        dynamodb = _get_dynamodb()
        table = dynamodb.Table(DECISIONS_TABLE)
        item = {
            "userId": user_id,
            "timestamp": payload.get("timestamp", datetime.now(timezone.utc).isoformat()),
            **{k: v for k, v in payload.items() if k != "userId"},
        }
        item = _sanitize_for_dynamo(item)
        table.put_item(Item=item)
    except Exception:
        logger.exception("DynamoDB write failed")
        return _build_response(500, json.dumps({"error": {"code": "INTERNAL_ERROR", "message": "Failed to write decision"}}))

    return _build_response(200, json.dumps({"message": "Decision recorded", "userId": user_id}))


# ---------------------------------------------------------------------------
# Router handler — dispatches based on HTTP method and resource path
# ---------------------------------------------------------------------------

_ROUTE_MAP = {
    ("GET", "/profile/{userId}"): get_profile,
    ("PUT", "/profile/{userId}"): put_profile,
    ("GET", "/decisions/{userId}"): get_decisions,
    ("POST", "/decisions/{userId}"): post_decision,
}


def handler(event, context):
    """Unified Lambda handler that routes to the correct function."""
    method = event.get("httpMethod", "").upper()
    resource = event.get("resource", "")

    route_fn = _ROUTE_MAP.get((method, resource))
    if route_fn is None:
        return _build_response(404, json.dumps({
            "error": {
                "code": "NOT_FOUND",
                "message": f"No route for {method} {resource}",
            }
        }))

    return route_fn(event, context)
