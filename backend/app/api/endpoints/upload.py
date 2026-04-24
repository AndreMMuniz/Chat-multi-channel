from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.storage_service import storage_service
from typing import Dict

router = APIRouter()

_MAX_SIZES: Dict[str, int] = {
    "images":    5  * 1024 * 1024,  # 5 MB
    "audio":     10 * 1024 * 1024,  # 10 MB
    "videos":    50 * 1024 * 1024,  # 50 MB
    "documents": 20 * 1024 * 1024,  # 20 MB
    "general":   20 * 1024 * 1024,  # 20 MB
}

@router.post("")
async def upload_file(file: UploadFile = File(...)) -> Dict[str, str]:
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    content_type = file.content_type or ""
    if content_type.startswith("image/"):
        folder = "images"
    elif content_type.startswith("audio/"):
        folder = "audio"
    elif content_type.startswith("video/"):
        folder = "videos"
    else:
        folder = "documents"

    # Read once to validate size, then seek back for storage_service
    content = await file.read()
    limit = _MAX_SIZES.get(folder, _MAX_SIZES["general"])
    if len(content) > limit:
        limit_mb = limit // (1024 * 1024)
        raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {limit_mb} MB.")
    await file.seek(0)

    url = await storage_service.upload_file(file, folder=folder)
    if not url:
        raise HTTPException(status_code=500, detail="Failed to upload file to storage")

    return {"url": url}
