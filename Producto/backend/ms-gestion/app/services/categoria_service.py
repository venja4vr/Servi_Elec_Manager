from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.categoria import Categoria
from app.schemas.categoria import CategoriaCreate

def listar_categorias(db: Session):
    return db.query(Categoria).all()

def obtener_categoria(db: Session, categoria_id: str):
    cat = db.query(Categoria).filter(Categoria.id_categoria == categoria_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return cat

def crear_categoria(db: Session, data: CategoriaCreate):
    cat = Categoria(nombre_categoria=data.nombre_categoria)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

def eliminar_categoria(db: Session, categoria_id: str):
    cat = obtener_categoria(db, categoria_id)
    db.delete(cat)
    db.commit()
    return {"mensaje": "Categoría eliminada"}