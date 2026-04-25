"""Base model with camelCase alias support for API compatibility."""

from pydantic import BaseModel, ConfigDict


def to_camel(string: str) -> str:
    """Convert snake_case to camelCase."""
    parts = string.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:])


class CamelModel(BaseModel):
    """Base model that accepts both camelCase and snake_case field names."""

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )
