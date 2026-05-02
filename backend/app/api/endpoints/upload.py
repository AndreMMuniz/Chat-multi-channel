from fastapi import APIRouter, Request, UploadFile, File, HTTPException
from app.services.storage_service import storage_service
from typing import Dict, Any
from app.schemas.common import create_response, create_error_response
from app.core.limiter import limiter

router = APIRouter()

_MAX_SIZES: Dict[str, int] = {
    "images":    5  * 1024 * 1024,  # 5 MB
    "audio":     10 * 1024 * 1024,  # 10 MB
    "videos":    50 * 1024 * 1024,  # 50 MB
    "documents": 20 * 1024 * 1024,  # 20 MB
    "general":   20 * 1024 * 1024,  # 20 MB
}

@router.post("")
@limiter.limit("30/minute")
async def upload_file(request: Request, file: UploadFile = File(...)) -> Dict[str, Any]:
    if not file:
        error_response, status = create_error_response(
            code="VALIDATION_ERROR",
            message="No file provided",
            status_code=400
        )
        raise HTTPException(status_code=status, detail=error_response)

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
        error_response, status = create_error_response(
            code="FILE_TOO_LARGE",
            message=f"File too large. Maximum size is {limit_mb} MB.",
            details={"limit_mb": limit_mb, "file_size_mb": len(content) // (1024 * 1024)},
            status_code=413
        )
        raise HTTPException(status_code=status, detail=error_response)
    await file.seek(0)

    url = await storage_service.upload_file(file, folder=folder)
    if not url:
        error_response, status = create_error_response(
            code="INTERNAL_ERROR",
            message="Failed to upload file to storage",
            status_code=500
        )
        raise HTTPException(status_code=status, detail=error_response)

    return create_response({"url": url})
