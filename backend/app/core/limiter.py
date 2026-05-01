"""Shared rate limiter instance for all API endpoints."""
import hashlib

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def _get_user_or_ip(request: Request) -> str:
    """Key function: hashed user token for authenticated requests, IP for anonymous."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:].strip()
        if token:
            return f"user:{_hash_token(token)}"
    cookie = request.cookies.get("access_token", "").strip()
    if cookie:
        return f"user:{_hash_token(cookie)}"
    return get_remote_address(request)


limiter = Limiter(key_func=_get_user_or_ip)
