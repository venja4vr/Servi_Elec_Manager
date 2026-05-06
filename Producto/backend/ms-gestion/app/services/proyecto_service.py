from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional
from app.models.proyecto import Proyecto
from app.schemas.proyecto import ProyectoCreate, ProyectoUpdate

def listar_proyectos(db: Session, estado: Optional[str] = None):
    q = db.query(Proyecto)
    if estado:
        q = q.filter(Proyecto.estado == estado)
    return q.order_by(Proyecto.fecha_inicio.desc()).all()

def obtener_proyecto(db: Session, proyecto_id: str):
    p = db.query(Proyecto).filter(Proyecto.id_proyecto == proyecto_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    return p

def crear_proyecto(db: Session, data: ProyectoCreate):
    p = Proyecto(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

def actualizar_proyecto(db: Session, proyecto_id: str, data: ProyectoUpdate):
    p = obtener_proyecto(db, proyecto_id)
    for campo, valor in data.model_dump(exclude_none=True).items():
        setattr(p, campo, valor)
    db.commit()
    db.refresh(p)
    return p

def cambiar_estado(db: Session, proyecto_id: str, nuevo_estado: str):
    estados_validos = ["pendiente", "en_curso", "finalizado", "cancelado"]
    if nuevo_estado not in estados_validos:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Válidos: {estados_validos}")
    p = obtener_proyecto(db, proyecto_id)
    p.estado = nuevo_estado
    db.commit()
    db.refresh(p)
    return p

def eliminar_proyecto(db: Session, proyecto_id: str):
    p = obtener_proyecto(db, proyecto_id)
    db.delete(p)
    db.commit()
    return {"mensaje": "Proyecto eliminado"}