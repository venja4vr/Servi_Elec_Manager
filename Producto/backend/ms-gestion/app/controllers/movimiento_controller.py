from sqlalchemy.orm import Session
from app.services import movimiento_service
from app.schemas.movimiento import MovimientoCreate

def get_all(db: Session):
    return movimiento_service.listar_movimientos(db)

def get_by_proyecto(db: Session, proyecto_id: str):
    return movimiento_service.listar_por_proyecto(db, proyecto_id)

def create(db: Session, data: MovimientoCreate):
    return movimiento_service.registrar_movimiento(db, data)