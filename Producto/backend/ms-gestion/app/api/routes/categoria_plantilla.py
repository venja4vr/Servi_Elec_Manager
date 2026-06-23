from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.controllers import categoria_plantilla_controller
from app.schemas.categoria_plantilla import (
    CategoriaPlantillaIn,
    CategoriaPlantillaUpdate,
    CategoriaPlantillaOut,
)
from app.utils.auth import get_current_user, require_admin

router = APIRouter(prefix="/categoria-plantilla", tags=["Categorías de Plantilla"])


@router.get("/", response_model=List[CategoriaPlantillaOut])
def listar(
    solo_con_plantillas: bool = Query(False),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return categoria_plantilla_controller.get_all(db, solo_con_plantillas)


@router.post("/", response_model=CategoriaPlantillaOut, status_code=201)
def crear(
    data: CategoriaPlantillaIn,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return categoria_plantilla_controller.create(db, data)


@router.put("/{id_categoria}", response_model=CategoriaPlantillaOut)
def actualizar(
    id_categoria: str,
    data: CategoriaPlantillaUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return categoria_plantilla_controller.update(db, id_categoria, data)


@router.delete("/{id_categoria}")
def desactivar(
    id_categoria: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return categoria_plantilla_controller.delete(db, id_categoria)
