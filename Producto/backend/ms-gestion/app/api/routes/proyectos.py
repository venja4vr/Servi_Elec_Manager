from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.controllers import proyecto_controller
from app.schemas.proyecto import (
    ProyectoCreate,
    ProyectoUpdate,
    ProyectoOut,
    ProyectoCreateConMateriales,
)
from app.utils.auth import get_current_user, require_admin


router = APIRouter(prefix="/proyectos", tags=["Proyectos"])


@router.get("/", response_model=List[ProyectoOut])
def listar(
    estado: Optional[str] = Query(None, description="pendiente | en_curso | finalizado | cancelado"),
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    return proyecto_controller.get_all(db, estado)


@router.get("/{proyecto_id}", response_model=ProyectoOut)
def obtener(proyecto_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return proyecto_controller.get_one(db, proyecto_id)


@router.get("/{proyecto_id}/materiales")
def obtener_materiales_planeados(
    proyecto_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    """Devuelve los materiales que el proyecto planea/planeó usar, con info del inventario."""
    return proyecto_controller.get_materiales_planeados(db, proyecto_id)


@router.post("/", response_model=ProyectoOut, status_code=201)
def crear(data: ProyectoCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    """Crear proyecto sin materiales (uso básico/legacy)."""
    return proyecto_controller.create(db, data)


@router.post("/con-materiales", response_model=ProyectoOut, status_code=201)
def crear_con_materiales(
    data: ProyectoCreateConMateriales,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    """
    Crea un proyecto con su lista de materiales planeados.
    El proyecto se crea en estado 'pendiente'.
    NO descuenta stock hasta que cambie a 'en_curso'.
    """
    return proyecto_controller.create_con_materiales(db, data)


@router.put("/{proyecto_id}", response_model=ProyectoOut)
def actualizar(
    proyecto_id: str,
    data: ProyectoUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    return proyecto_controller.update(db, proyecto_id, data)


@router.patch("/{proyecto_id}/estado", response_model=ProyectoOut)
def cambiar_estado(
    proyecto_id: str,
    nuevo_estado: str = Query(..., description="pendiente | en_curso | finalizado | cancelado"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Cambia el estado del proyecto.
    - pendiente → en_curso: descuenta stock automáticamente.
    - en_curso → cancelado: devuelve stock al inventario.
    """
    return proyecto_controller.cambiar_estado(
        db,
        proyecto_id,
        nuevo_estado,
        current_user["id_usuario"]
    )


@router.delete("/{proyecto_id}")
def eliminar(proyecto_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    return proyecto_controller.delete(db, proyecto_id)