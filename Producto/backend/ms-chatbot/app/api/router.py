from fastapi import APIRouter
from app.api.routes.health  import router as health_router
from app.api.routes.webhook import router as webhook_router
# router.py: registra todas las rutas

api_router = APIRouter()

api_router.include_router(health_router) # GET / y GET /health
api_router.include_router(webhook_router) # GET /webhook/ y POST /webhook/