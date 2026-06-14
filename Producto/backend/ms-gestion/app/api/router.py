from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.categorias import router as categorias_router
from app.api.routes.materiales import router as materiales_router
from app.api.routes.plantillas import router as plantillas_router
from app.api.routes.proyectos import router as proyectos_router
from app.api.routes.movimientos import router as movimientos_router
from app.api.routes.usuarios import router as usuarios_router
from app.api.routes.auth import router as auth_router
from app.api.routes.comparador import router as comparador_router
from app.api.routes.comuna_grupos import router as comuna_grupos_router
from app.api.routes.notificaciones import router as notificaciones_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(categorias_router)
api_router.include_router(materiales_router)
api_router.include_router(plantillas_router)
api_router.include_router(proyectos_router)
api_router.include_router(movimientos_router)
api_router.include_router(usuarios_router)
api_router.include_router(auth_router)
api_router.include_router(comparador_router)
api_router.include_router(comuna_grupos_router)
api_router.include_router(notificaciones_router)