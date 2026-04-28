"""
Tests that verify all endpoints return {data, meta} response format.
These are format-compliance tests — they do NOT test business logic.
"""

import pytest
from app.schemas.common import create_response, create_paginated_response, create_error_response


class TestResponseHelpers:
    """Unit tests for response helper functions in schemas/common.py."""

    def test_create_response_has_data_and_meta(self):
        result = create_response({"id": "123", "name": "Test"})
        assert "data" in result
        assert "meta" in result
        assert result["data"]["id"] == "123"
        assert "timestamp" in result["meta"]

    def test_create_response_extra_meta(self):
        result = create_response("hello", custom_field="value")
        assert result["meta"]["custom_field"] == "value"

    def test_create_paginated_response_structure(self):
        result = create_paginated_response(
            data=[{"id": "1"}, {"id": "2"}],
            total=50,
            page=1,
            page_size=20,
        )
        assert "data" in result
        assert "meta" in result
        meta = result["meta"]
        assert meta["total"] == 50
        assert meta["page"] == 1
        assert meta["page_size"] == 20
        assert meta["total_pages"] == 3
        assert meta["has_next"] is True
        assert meta["has_previous"] is False
        assert "timestamp" in meta

    def test_paginated_last_page(self):
        result = create_paginated_response(data=[], total=10, page=2, page_size=10)
        assert result["meta"]["has_next"] is False
        assert result["meta"]["has_previous"] is True

    def test_paginated_single_page(self):
        result = create_paginated_response(data=["a", "b"], total=2, page=1, page_size=10)
        assert result["meta"]["has_next"] is False
        assert result["meta"]["has_previous"] is False

    def test_create_error_response_structure(self):
        body, status_code = create_error_response(
            code="USER_NOT_FOUND",
            message="User not found",
            status_code=404,
        )
        assert status_code == 404
        assert "error" in body
        error = body["error"]
        assert error["code"] == "USER_NOT_FOUND"
        assert error["message"] == "User not found"
        assert "timestamp" in error
        assert error["details"] == {}

    def test_create_error_response_with_details(self):
        body, _ = create_error_response(
            code="VALIDATION_ERROR",
            message="Invalid input",
            details={"field": "email"},
            status_code=422,
        )
        assert body["error"]["details"]["field"] == "email"

    def test_list_response_data_is_list(self):
        result = create_paginated_response(data=[], total=0, page=1, page_size=20)
        assert isinstance(result["data"], list)

    def test_response_timestamp_is_string(self):
        result = create_response(None)
        assert isinstance(result["meta"]["timestamp"], str)

    def test_error_response_timestamp_is_string(self):
        body, _ = create_error_response("CODE", "msg")
        assert isinstance(body["error"]["timestamp"], str)
