from sqlalchemy.orm import Session
from app.services import plantilla_service
from app.schemas.plantilla import PlantillaCreate, PlantillaUpdate

def get_all(db: Session):
    return plantilla_service.listar_plantillas(db)

def get_one(db: Session, plantilla_id: str):
    return plantilla_service.obtener_plantilla(db, plantilla_id)

def create(db: Session, data: PlantillaCreate):
    return plantilla_service.crear_plantilla(db, data)

def update(db: Session, plantilla_id: str, data: PlantillaUpdate):
    return plantilla_service.actualizar_plantilla(db, plantilla_id, data)

def delete(db: Session, plantilla_id: str):
    return plantilla_service.eliminar_plantilla(db, plantilla_id)