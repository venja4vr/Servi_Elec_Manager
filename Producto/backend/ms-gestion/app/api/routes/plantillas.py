from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.controllers import plantilla_controller
from app.schemas.plantilla import (
    PlantillaCreate,
    PlantillaUpdate,
    PlantillaOut,
    PlantillaConMaterialesOut,
    CotizacionPlantillaOut,
)
from app.utils.auth import get_current_user, require_admin


router = APIRouter(prefix="/plantillas", tags=["Plantillas"])


@router.get("/", response_model=List[PlantillaOut])
def listar(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return plantilla_controller.get_all(db)


# Ruta estática antes de las paramétricas
@router.get("/categoria/{categoria_nombre}", response_model=List[PlantillaOut])
def listar_por_categoria(
    categoria_nombre: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Devuelve plantillas activas filtradas por categoría. Usado por el bot."""
    from app.services import plantilla_service
    return plantilla_service.listar_plantillas_por_categoria(db, categoria_nombre)


@router.get("/{plantilla_id}", response_model=PlantillaOut)
def obtener(plantilla_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return plantilla_controller.get_one(db, plantilla_id)


@router.get("/{plantilla_id}/materiales", response_model=PlantillaConMaterialesOut)
def obtener_materiales(
    plantilla_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Devuelve los materiales vinculados a la plantilla con datos de inventario."""
    return plantilla_controller.get_materiales(db, plantilla_id)


@router.get("/{plantilla_id}/cotizacion", response_model=CotizacionPlantillaOut)
def obtener_cotizacion(
    plantilla_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Calcula el total estimado de la plantilla usando precios Sodimac actuales."""
    return plantilla_controller.get_cotizacion(db, plantilla_id)


@router.post("/", response_model=PlantillaOut, status_code=201)
def crear(data: PlantillaCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return plantilla_controller.create(db, data)


@router.put("/{plantilla_id}", response_model=PlantillaOut)
def actualizar(
    plantilla_id: str,
    data: PlantillaUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return plantilla_controller.update(db, plantilla_id, data)


@router.delete("/{plantilla_id}")
def eliminar(
    plantilla_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return plantilla_controller.delete(db, plantilla_id)
