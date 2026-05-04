from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.controllers import proyecto_controller
from app.schemas.proyecto import ProyectoCreate, ProyectoUpdate, ProyectoOut

router = APIRouter(prefix="/proyectos", tags=["Proyectos"])

@router.get("/", response_model=List[ProyectoOut])
def listar(
    estado: Optional[str] = Query(None, description="pendiente | en_curso | finalizado | cancelado"),
    db: Session = Depends(get_db)
):
    return proyecto_controller.get_all(db, estado)

@router.get("/{proyecto_id}", response_model=ProyectoOut)
def obtener(proyecto_id: str, db: Session = Depends(get_db)):
    return proyecto_controller.get_one(db, proyecto_id)

@router.post("/", response_model=ProyectoOut, status_code=201)
def crear(data: ProyectoCreate, db: Session = Depends(get_db)):
    return proyecto_controller.create(db, data)

@router.put("/{proyecto_id}", response_model=ProyectoOut)
def actualizar(proyecto_id: str, data: ProyectoUpdate, db: Session = Depends(get_db)):
    return proyecto_controller.update(db, proyecto_id, data)

@router.patch("/{proyecto_id}/estado", response_model=ProyectoOut)
def cambiar_estado(
    proyecto_id: str,
    nuevo_estado: str = Query(..., description="pendiente | en_curso | finalizado | cancelado"),
    db: Session = Depends(get_db)
):
    return proyecto_controller.cambiar_estado(db, proyecto_id, nuevo_estado)

@router.delete("/{proyecto_id}")
def eliminar(proyecto_id: str, db: Session = Depends(get_db)):
    return proyecto_controller.delete(db, proyecto_id)