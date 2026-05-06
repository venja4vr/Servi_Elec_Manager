from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.material import Material
from app.schemas.material import MaterialCreate, MaterialUpdate

def listar_materiales(db: Session, solo_criticos: bool = False):
    materiales = db.query(Material).all()
    if solo_criticos:
        materiales = [m for m in materiales if m.stock_bajo]
    return materiales

def obtener_material(db: Session, material_id: str):
    mat = db.query(Material).filter(Material.id_material == material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    return mat

def crear_material(db: Session, data: MaterialCreate):
    mat = Material(**data.model_dump())
    db.add(mat)
    db.commit()
    db.refresh(mat)
    return mat

def actualizar_material(db: Session, material_id: str, data: MaterialUpdate):
    mat = obtener_material(db, material_id)
    for campo, valor in data.model_dump(exclude_none=True).items():
        setattr(mat, campo, valor)
    db.commit()
    db.refresh(mat)
    return mat

def eliminar_material(db: Session, material_id: str):
    mat = obtener_material(db, material_id)
    db.delete(mat)
    db.commit()
    return {"mensaje": "Material eliminado"}

def ajustar_stock(db: Session, material_id: str, cantidad: int):
    mat = obtener_material(db, material_id)
    nuevo_stock = mat.stock_actual + cantidad
    if nuevo_stock < 0:
        raise HTTPException(status_code=400, detail=f"Stock insuficiente. Stock actual: {mat.stock_actual}")
    mat.stock_actual = nuevo_stock
    db.commit()
    db.refresh(mat)
    return mat