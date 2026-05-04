from sqlalchemy.orm import Session
from typing import Optional
from app.services import proyecto_service
from app.schemas.proyecto import ProyectoCreate, ProyectoUpdate

def get_all(db: Session, estado: Optional[str] = None):
    return proyecto_service.listar_proyectos(db, estado)

def get_one(db: Session, proyecto_id: str):
    return proyecto_service.obtener_proyecto(db, proyecto_id)

def create(db: Session, data: ProyectoCreate):
    return proyecto_service.crear_proyecto(db, data)

def update(db: Session, proyecto_id: str, data: ProyectoUpdate):
    return proyecto_service.actualizar_proyecto(db, proyecto_id, data)

def cambiar_estado(db: Session, proyecto_id: str, nuevo_estado: str):
    return proyecto_service.cambiar_estado(db, proyecto_id, nuevo_estado)

def delete(db: Session, proyecto_id: str):
    return proyecto_service.eliminar_proyecto(db, proyecto_id)