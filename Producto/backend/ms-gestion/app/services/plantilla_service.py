from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.plantilla import Plantilla
from app.schemas.plantilla import PlantillaCreate, PlantillaUpdate

def listar_plantillas(db: Session):
    return db.query(Plantilla).all()

def obtener_plantilla(db: Session, plantilla_id: str):
    p = db.query(Plantilla).filter(Plantilla.id_plantilla == plantilla_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return p

def crear_plantilla(db: Session, data: PlantillaCreate):
    p = Plantilla(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

def actualizar_plantilla(db: Session, plantilla_id: str, data: PlantillaUpdate):
    p = obtener_plantilla(db, plantilla_id)
    for campo, valor in data.model_dump(exclude_none=True).items():
        setattr(p, campo, valor)
    db.commit()
    db.refresh(p)
    return p

def eliminar_plantilla(db: Session, plantilla_id: str):
    p = obtener_plantilla(db, plantilla_id)
    db.delete(p)
    db.commit()
    return {"mensaje": "Plantilla eliminada"}