"""Chat models for the Strands Agent chatbot."""

from typing import Literal

from pydantic import BaseModel

from .base import CamelModel
from .product import ProductData
from .profile import UserProfile
from .tec import TECResponse


class ChatMessage(CamelModel):
    """A single message in a conversation."""

    role: Literal["user", "assistant"]
    content: str
    timestamp: str  # ISO 8601


class ChatRequest(CamelModel):
    """Incoming chatbot request."""

    message: str
    product_context: ProductData
    tec_data: TECResponse | None
    conversation_history: list[ChatMessage]
    user_profile: UserProfile


class ChatResponse(CamelModel):
    """Chatbot response."""

    reply: str
    sources: list[str]
