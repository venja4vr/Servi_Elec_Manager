from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.categorias import router as categorias_router
from app.api.routes.materiales import router as materiales_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(categorias_router)
api_router.include_router(materiales_router)