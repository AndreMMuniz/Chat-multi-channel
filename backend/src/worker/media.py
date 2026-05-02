"""Media download helper used by the worker when processing messages with attachments."""

import httpx
from typing import Optional


async def download_media(url: str, headers: Optional[dict] = None) -> bytes:
    """Download media from a URL and return raw bytes."""
    async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
        response = await client.get(url, headers=headers or {})
        response.raise_for_status()
        return response.content
