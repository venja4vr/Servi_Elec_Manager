import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.db.database import Base, engine
from app.core.config import APP_NAME


def _startup_price_check() -> None:
    """Comprueba al arrancar si los precios Sodimac tienen > 24h de antigüedad.
    Si es así, dispara una actualización en background sin bloquear el arranque.
    Se ejecuta en un hilo daemon para no bloquear uvicorn."""
    import time
    time.sleep(5)  # Esperar a que la DB esté disponible
    try:
        from app.db.database import SessionLocal
        from app.services import precio_service
        from app.models.material import Material
        from sqlalchemy import func
        from datetime import datetime, timedelta

        db = SessionLocal()
        try:
            ultimo = db.query(func.max(Material.precio_sodimac_actualizado)).scalar()
            ahora = datetime.utcnow()
            if ultimo is None or (ahora - ultimo) > timedelta(hours=24):
                print("[startup] Precios Sodimac desactualizados — actualizando en background...")
                resultado = precio_service.actualizar_todos_los_precios(db)
                print(f"[startup] Precios: {resultado['actualizados']} actualizados, "
                      f"{resultado['fallidos']} fallidos de {resultado['total']}")
            else:
                horas = int((ahora - ultimo).total_seconds() / 3600)
                print(f"[startup] Precios Sodimac al día (hace {horas}h). No se actualiza.")
        finally:
            db.close()
    except Exception as e:
        print(f"[startup] Verificación de precios omitida: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Lanzar comprobación de precios como hilo daemon (no bloquea el arranque)
    hilo = threading.Thread(target=_startup_price_check, daemon=True)
    hilo.start()
    yield
    # Shutdown: el hilo es daemon, se cierra automáticamente


app = FastAPI(title=APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://98.95.225.248",
        "http://98.95.225.248:80",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
