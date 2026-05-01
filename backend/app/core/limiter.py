"""Shared rate limiter instance for all API endpoints."""
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def _get_user_or_ip(request: Request) -> str:
    """Key function: user token for authenticated requests, IP for anonymous."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return f"user:{auth[7:71]}"
    token = request.cookies.get("access_token", "")
    if token:
        return f"user:{token[:64]}"
    return get_remote_address(request)


limiter = Limiter(key_func=_get_user_or_ip)
