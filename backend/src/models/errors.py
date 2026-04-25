"""Error response models."""

from pydantic import BaseModel

from .base import CamelModel


class ValidationErrorDetail(CamelModel):
    """A single field-level validation error."""

    field: str
    error: str


class ErrorDetail(CamelModel):
    """Structured error object."""

    code: str
    message: str
    details: list[ValidationErrorDetail]


class ErrorResponse(CamelModel):
    """Standard error response envelope."""

    error: ErrorDetail
