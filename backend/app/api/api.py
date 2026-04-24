from fastapi import APIRouter
from app.api.endpoints import chat, telegram, auth, users, audit, dashboard, upload
from app.api.endpoints.config_routes import router as config_router

print(f">>> config_router routes: {[r.path for r in config_router.routes]}")

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/admin", tags=["admin"])
api_router.include_router(audit.router, prefix="/admin", tags=["audit"])
api_router.include_router(dashboard.router, prefix="/admin", tags=["dashboard"])
api_router.include_router(config_router, prefix="/admin", tags=["settings"])
print(f">>> api_router total routes: {len(api_router.routes)}")
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
api_router.include_router(telegram.router, prefix="/telegram", tags=["telegram"])
