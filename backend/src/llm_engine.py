"""LLM-powered engine — fast alternatives with real URLs."""

import json
import logging
import os

import boto3

from models.product import ProductData
from models.profile import UserProfile

logger = logging.getLogger(__name__)

BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "us.anthropic.claude-3-5-haiku-20241022-v1:0")
BEDROCK_REGION = os.environ.get("BEDROCK_REGION", "us-east-1")

_bedrock_client = None


def _get_bedrock():
    global _bedrock_client
    if _bedrock_client is None:
        _bedrock_client = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)
    return _bedrock_client


def _call_bedrock(prompt: str, system: str = "") -> str:
    client = _get_bedrock()
    messages = [{"role": "user", "content": [{"text": prompt}]}]
    kwargs = {
        "modelId": BEDROCK_MODEL_ID,
        "messages": messages,
        "inferenceConfig": {"maxTokens": 1024, "temperature": 0.1},
    }
    if system:
        kwargs["system"] = [{"text": system}]
    response = client.converse(**kwargs)
    return response["output"]["message"]["content"][0]["text"]


def estimate_price_with_llm(product_name: str, platform: str) -> float:
    """Quick LLM call to estimate product price."""
    try:
        resp = _call_bedrock(
            f"Current US retail price for {product_name}? Reply with ONLY a number, no $ sign.",
            "Reply with only a number."
        )
        return float(resp.strip().replace("$", "").replace(",", ""))
    except Exception:
        return 0.0


def find_real_alternatives_with_llm(product: ProductData, profile: UserProfile) -> list[dict]:
    """Fast LLM call to find real alternative URLs and prices."""
    name_encoded = product.product_name.replace(" ", "+")

    prompt = f"""Find 4 alternatives for "{product.product_name}" (${product.listed_price:.0f}) NOT on {product.platform_id}.
Return ONLY a JSON array:
[{{"product_name":"...","seller":"Amazon","platform_id":"amazon","listed_price":99.99,"product_url":"https://www.amazon.com/s?k={name_encoded}"}},...]

Use these URL patterns:
amazon: https://www.amazon.com/s?k={name_encoded}
walmart: https://www.walmart.com/search?q={name_encoded}
target: https://www.target.com/s?searchTerm={name_encoded}
bestbuy: https://www.bestbuy.com/site/searchpage.jsp?st={name_encoded}
ebay: https://www.ebay.com/sch/i.html?_nkw={name_encoded}
costco: https://www.costco.com/CatalogSearch?keyword={name_encoded}"""

    try:
        resp = _call_bedrock(prompt, "Return ONLY valid JSON array. No markdown.")
        cleaned = resp.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        data = json.loads(cleaned)
        return data if isinstance(data, list) else []
    except Exception as e:
        logger.warning(f"LLM alternatives failed: {e}")
        return []
