"""Tests for profile_handler Lambda handlers."""

import json

import boto3
import pytest
from moto import mock_aws

import profile_handler


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def _make_profile_body() -> dict:
    return {
        "user_id": "u1",
        "memberships": [],
        "student_status": None,
        "payment_methods": [],
        "return_comfort_level": 3,
        "citizenship_residency": None,
        "cloud_sync_enabled": False,
        "last_modified": "2025-01-01T00:00:00Z",
    }


def _api_event(
    body: str | None = None,
    method: str = "GET",
    path: str = "/profile/u1",
    user_id: str | None = "u1",
) -> dict:
    return {
        "body": body,
        "httpMethod": method,
        "path": path,
        "pathParameters": {"userId": user_id} if user_id else None,
    }


@pytest.fixture()
def _mock_dynamo():
    with mock_aws():
        profile_handler._dynamodb = None
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
        profile_handler._dynamodb = None


# ---------------------------------------------------------------------------
# Profile CRUD tests
# ---------------------------------------------------------------------------

class TestGetProfile:
    def test_missing_user_id_returns_400(self, _mock_dynamo):
        event = _api_event(user_id=None)
        resp = profile_handler.get_profile(event, None)
        assert resp["statusCode"] == 400

    def test_not_found_returns_404(self, _mock_dynamo):
        event = _api_event(user_id="nonexistent")
        resp = profile_handler.get_profile(event, None)
        assert resp["statusCode"] == 404

    def test_found_returns_200(self, _mock_dynamo):
        # Seed a profile
        table = _mock_dynamo.Table("truecost-profiles")
        table.put_item(Item={"userId": "u1", "profile": {"user_id": "u1"}, "lastModified": "2025-01-01T00:00:00Z"})
        event = _api_event(user_id="u1")
        resp = profile_handler.get_profile(event, None)
        assert resp["statusCode"] == 200
        body = json.loads(resp["body"])
        assert body["userId"] == "u1"


class TestPutProfile:
    def test_missing_user_id_returns_400(self, _mock_dynamo):
        event = _api_event(method="PUT", user_id=None, body=json.dumps(_make_profile_body()))
        resp = profile_handler.put_profile(event, None)
        assert resp["statusCode"] == 400

    def test_empty_body_returns_400(self, _mock_dynamo):
        event = _api_event(method="PUT", body="")
        resp = profile_handler.put_profile(event, None)
        assert resp["statusCode"] == 400

    def test_invalid_json_returns_400(self, _mock_dynamo):
        event = _api_event(method="PUT", body="not json")
        resp = profile_handler.put_profile(event, None)
        assert resp["statusCode"] == 400

    def test_invalid_profile_returns_400(self, _mock_dynamo):
        event = _api_event(method="PUT", body=json.dumps({"return_comfort_level": 99}))
        resp = profile_handler.put_profile(event, None)
        assert resp["statusCode"] == 400

    def test_valid_profile_returns_200(self, _mock_dynamo):
        event = _api_event(method="PUT", body=json.dumps(_make_profile_body()))
        resp = profile_handler.put_profile(event, None)
        assert resp["statusCode"] == 200
        # Verify it was written
        table = _mock_dynamo.Table("truecost-profiles")
        result = table.get_item(Key={"userId": "u1"})
        assert "Item" in result


# ---------------------------------------------------------------------------
# Decision history tests
# ---------------------------------------------------------------------------

class TestGetDecisions:
    def test_missing_user_id_returns_400(self, _mock_dynamo):
        event = _api_event(user_id=None, path="/decisions/")
        resp = profile_handler.get_decisions(event, None)
        assert resp["statusCode"] == 400

    def test_empty_history_returns_200(self, _mock_dynamo):
        event = _api_event(user_id="u1", path="/decisions/u1")
        resp = profile_handler.get_decisions(event, None)
        assert resp["statusCode"] == 200
        body = json.loads(resp["body"])
        assert body == []

    def test_returns_seeded_decisions(self, _mock_dynamo):
        table = _mock_dynamo.Table("truecost-decisions")
        table.put_item(Item={"userId": "u1", "timestamp": "2025-01-01T00:00:00Z", "productName": "Widget"})
        event = _api_event(user_id="u1", path="/decisions/u1")
        resp = profile_handler.get_decisions(event, None)
        assert resp["statusCode"] == 200
        body = json.loads(resp["body"])
        assert len(body) == 1
        assert body[0]["productName"] == "Widget"


class TestPostDecision:
    def test_missing_user_id_returns_400(self, _mock_dynamo):
        event = _api_event(method="POST", user_id=None, body=json.dumps({}))
        resp = profile_handler.post_decision(event, None)
        assert resp["statusCode"] == 400

    def test_empty_body_returns_400(self, _mock_dynamo):
        event = _api_event(method="POST", body="")
        resp = profile_handler.post_decision(event, None)
        assert resp["statusCode"] == 400

    def test_missing_required_fields_returns_400(self, _mock_dynamo):
        event = _api_event(method="POST", body=json.dumps({"productName": "Widget"}))
        resp = profile_handler.post_decision(event, None)
        assert resp["statusCode"] == 400
        body = json.loads(resp["body"])
        assert body["error"]["code"] == "VALIDATION_ERROR"

    def test_valid_decision_returns_200(self, _mock_dynamo):
        decision = {
            "productName": "Widget",
            "listedPrice": 29.99,
            "chosenTec": 34.0,
            "platform": "amazon",
            "fairnessVerdict": "clean",
        }
        event = _api_event(method="POST", body=json.dumps(decision))
        resp = profile_handler.post_decision(event, None)
        assert resp["statusCode"] == 200
        # Verify it was written
        table = _mock_dynamo.Table("truecost-decisions")
        result = table.scan()
        assert result["Count"] == 1
