from sqlalchemy.orm import Session
from app.services import proyecto_service
from app.schemas.proyecto import ProyectoCreate, ProyectoUpdate, ProyectoCreateConMateriales


def get_all(db: Session, estado: str = None):
    return proyecto_service.listar_proyectos(db, estado)


def get_one(db: Session, proyecto_id: str):
    return proyecto_service.obtener_proyecto(db, proyecto_id)


def create(db: Session, data: ProyectoCreate):
    return proyecto_service.crear_proyecto(db, data)


def create_con_materiales(db: Session, data: ProyectoCreateConMateriales):
    return proyecto_service.crear_proyecto_con_materiales(db, data)


def update(db: Session, proyecto_id: str, data: ProyectoUpdate):
    return proyecto_service.actualizar_proyecto(db, proyecto_id, data)


def cambiar_estado(db: Session, proyecto_id: str, nuevo_estado: str, usuario_id: str):
    return proyecto_service.cambiar_estado(db, proyecto_id, nuevo_estado, usuario_id)


def delete(db: Session, proyecto_id: str):
    return proyecto_service.eliminar_proyecto(db, proyecto_id)


def get_materiales_planeados(db: Session, proyecto_id: str):
    return proyecto_service.obtener_materiales_planeados(db, proyecto_id)