"""Tests for truecost_handler Lambda handler."""

import json

import boto3
import pytest
from moto import mock_aws

import truecost_handler


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def _make_valid_body() -> dict:
    """Return a valid TECRequest payload."""
    return {
        "product": {
            "product_name": "Widget",
            "listed_price": 29.99,
            "currency": "USD",
            "seller": "Acme",
            "platform_id": "amazon",
            "page_url": "https://example.com/widget",
            "page_type": "product",
            "extracted_at": "2025-01-01T00:00:00Z",
        },
        "user_profile": {
            "user_id": "u1",
            "memberships": [],
            "student_status": None,
            "payment_methods": [],
            "return_comfort_level": 3,
            "citizenship_residency": None,
            "cloud_sync_enabled": False,
            "last_modified": "2025-01-01T00:00:00Z",
        },
    }


def _api_event(body: str | None = None, method: str = "POST", path: str = "/tec") -> dict:
    """Build a minimal API Gateway proxy event."""
    return {
        "body": body,
        "httpMethod": method,
        "path": path,
    }


@pytest.fixture()
def _mock_dynamo():
    """Create mock DynamoDB tables for the handler."""
    with mock_aws():
        truecost_handler._dynamodb = None  # reset cached resource
        ddb = boto3.resource("dynamodb", region_name="us-east-1")
        ddb.create_table(
            TableName="truecost-profiles",
            KeySchema=[{"AttributeName": "userId", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "userId", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )
        ddb.create_table(
            TableName="truecost-decisions",
            KeySchema=[
                {"AttributeName": "userId", "KeyType": "HASH"},
                {"AttributeName": "timestamp", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "userId", "AttributeType": "S"},
                {"AttributeName": "timestamp", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        yield ddb
        truecost_handler._dynamodb = None


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestHandlerValidation:
    """Request validation tests."""

    def test_empty_body_returns_400(self, _mock_dynamo):
        event = _api_event(body="")
        resp = truecost_handler.handler(event, None)
        assert resp["statusCode"] == 400
        body = json.loads(resp["body"])
        assert body["error"]["code"] == "VALIDATION_ERROR"

    def test_invalid_json_returns_400(self, _mock_dynamo):
        event = _api_event(body="not json")
        resp = truecost_handler.handler(event, None)
        assert resp["statusCode"] == 400
        body = json.loads(resp["body"])
        assert body["error"]["code"] == "VALIDATION_ERROR"

    def test_missing_fields_returns_400(self, _mock_dynamo):
        event = _api_event(body=json.dumps({"product": {}}))
        resp = truecost_handler.handler(event, None)
        assert resp["statusCode"] == 400
        body = json.loads(resp["body"])
        assert body["error"]["code"] == "VALIDATION_ERROR"
        assert len(body["error"]["details"]) > 0

    def test_invalid_comfort_level_returns_400(self, _mock_dynamo):
        payload = _make_valid_body()
        payload["user_profile"]["return_comfort_level"] = 0
        event = _api_event(body=json.dumps(payload))
        resp = truecost_handler.handler(event, None)
        assert resp["statusCode"] == 400


class TestHandlerSuccess:
    """Successful TEC computation tests."""

    def test_valid_request_returns_200(self, _mock_dynamo):
        event = _api_event(body=json.dumps(_make_valid_body()))
        resp = truecost_handler.handler(event, None)
        assert resp["statusCode"] == 200
        body = json.loads(resp["body"])
        assert "tec" in body
        assert "layerBreakdown" in body
        assert "alternatives" in body
        assert "fairnessVerdict" in body
        assert "decisionImpactReport" in body

    def test_response_has_correct_content_type(self, _mock_dynamo):
        event = _api_event(body=json.dumps(_make_valid_body()))
        resp = truecost_handler.handler(event, None)
        assert resp["headers"]["Content-Type"] == "application/json"

    def test_tec_is_greater_than_listed_price(self, _mock_dynamo):
        event = _api_event(body=json.dumps(_make_valid_body()))
        resp = truecost_handler.handler(event, None)
        body = json.loads(resp["body"])
        assert body["tec"] >= body["listedPrice"]

    def test_decision_logged_to_dynamodb(self, _mock_dynamo):
        event = _api_event(body=json.dumps(_make_valid_body()))
        truecost_handler.handler(event, None)
        table = _mock_dynamo.Table("truecost-decisions")
        result = table.scan()
        assert result["Count"] >= 1
        item = result["Items"][0]
        assert item["userId"] == "u1"
        assert item["productName"] == "Widget"

    def test_profile_logged_to_dynamodb(self, _mock_dynamo):
        event = _api_event(body=json.dumps(_make_valid_body()))
        truecost_handler.handler(event, None)
        table = _mock_dynamo.Table("truecost-profiles")
        result = table.scan()
        assert result["Count"] >= 1
        item = result["Items"][0]
        assert item["userId"] == "u1"
