from sqlalchemy.orm import Session
from app.services import material_service
from app.schemas.material import MaterialCreate, MaterialUpdate

def get_all(db: Session, solo_criticos: bool = False):
    return material_service.listar_materiales(db, solo_criticos)

def get_one(db: Session, material_id: str):
    return material_service.obtener_material(db, material_id)

def create(db: Session, data: MaterialCreate):
    return material_service.crear_material(db, data)

def update(db: Session, material_id: str, data: MaterialUpdate):
    return material_service.actualizar_material(db, material_id, data)

def delete(db: Session, material_id: str):
    return material_service.eliminar_material(db, material_id)

def ajustar_stock(db: Session, material_id: str, cantidad: int):
    return material_service.ajustar_stock(db, material_id, cantidad)