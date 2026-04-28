"""Common schemas for API responses and errors."""

from pydantic import BaseModel, Field
from typing import Any, Dict, Generic, TypeVar, Optional, List
from datetime import datetime, timezone

T = TypeVar('T')


class ApiResponse(BaseModel, Generic[T]):
    """Generic API response wrapper for all endpoints."""
    data: T
    meta: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        json_schema_extra = {
            "example": {
                "data": {...},
                "meta": {
                    "timestamp": "2026-04-28T10:30:00Z"
                }
            }
        }


class PaginationMeta(BaseModel):
    """Pagination metadata for list responses."""
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool
    timestamp: str


class ErrorDetail(BaseModel):
    """Error response detail."""
    code: str = Field(..., description="Error code (e.g., 'INVALID_EMAIL')")
    message: str = Field(..., description="User-friendly error message")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Additional error details")
    timestamp: str = Field(..., description="ISO 8601 timestamp")


class ErrorResponse(BaseModel):
    """Standardized error response."""
    error: ErrorDetail

    class Config:
        json_schema_extra = {
            "example": {
                "error": {
                    "code": "INVALID_EMAIL",
                    "message": "Email format is invalid",
                    "details": {"field": "email", "value": "notanemail"},
                    "timestamp": "2026-04-28T10:30:00Z"
                }
            }
        }


# Helper functions for creating responses

def create_response(data: Any, **meta_kwargs) -> Dict[str, Any]:
    """
    Helper to create standardized response with data and metadata.

    Usage:
        return create_response(user, timestamp="2026-04-28T10:30:00Z")
    """
    return {
        "data": data,
        "meta": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **meta_kwargs
        }
    }


def create_paginated_response(
    data: List[Any],
    total: int,
    page: int = 1,
    page_size: int = 20
) -> Dict[str, Any]:
    """
    Helper to create paginated list response.

    Usage:
        users = await repos.users.find_all(skip=0, limit=20)
        total = await repos.users.count()
        return create_paginated_response(users, total, page=1, page_size=20)
    """
    total_pages = (total + page_size - 1) // page_size
    has_next = page < total_pages
    has_previous = page > 1

    return {
        "data": data,
        "meta": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_previous": has_previous,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    }


def create_error_response(
    code: str,
    message: str,
    details: Optional[Dict[str, Any]] = None,
    status_code: int = 400
) -> tuple[Dict[str, Any], int]:
    """
    Helper to create standardized error response.

    Returns tuple of (response_dict, http_status_code)

    Usage:
        if not user:
            response, status = create_error_response(
                code="USER_NOT_FOUND",
                message="User not found",
                status_code=404
            )
            raise HTTPException(status_code=status, detail=response)
    """
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    }, status_code


def create_validation_error_response(
    field_errors: Dict[str, List[str]]
) -> tuple[Dict[str, Any], int]:
    """
    Helper for validation errors with field-level details.

    Usage:
        errors = {"email": ["Email already exists"], "password": ["Too short"]}
        response, status = create_validation_error_response(errors)
        raise HTTPException(status_code=status, detail=response)
    """
    return {
        "error": {
            "code": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "details": field_errors,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    }, 422
