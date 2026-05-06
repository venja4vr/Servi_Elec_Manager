from sqlalchemy.orm import Session
from app.services import categoria_service
from app.schemas.categoria import CategoriaCreate

def get_all(db: Session):
    return categoria_service.listar_categorias(db)

def get_one(db: Session, categoria_id: str):
    return categoria_service.obtener_categoria(db, categoria_id)

def create(db: Session, data: CategoriaCreate):
    return categoria_service.crear_categoria(db, data)

def delete(db: Session, categoria_id: str):
    return categoria_service.eliminar_categoria(db, categoria_id)