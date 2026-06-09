from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app.db.database import get_db
from app.controllers import material_controller
from app.schemas.material import MaterialCreate, MaterialUpdate, MaterialOut
from app.schemas.precio_historico import PrecioHistoricoOut
from app.utils.auth import get_current_user, require_admin
from app.services import precio_service
from app.models.precio_historico import MaterialPrecioHistorico

router = APIRouter(prefix="/materiales", tags=["Materiales"])


class PrecioManualIn(BaseModel):
    precio: float = Field(..., ge=0)


@router.get("/", response_model=List[MaterialOut])
def listar(solo_criticos: bool = Query(False), db: Session = Depends(get_db), _=Depends(get_current_user)):
    return material_controller.get_all(db, solo_criticos)


# Rutas estáticas antes de las paramétricas para evitar ambigüedades
@router.post("/actualizar-precios")
def actualizar_todos_precios(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Actualiza precios Sodimac de todos los materiales. Puede demorar varios minutos."""
    resultado = precio_service.actualizar_todos_los_precios(db)
    return resultado


@router.post("/actualizar-precios-plantillas")
def actualizar_precios_plantillas(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Actualiza precios Sodimac solo de los materiales que están en alguna plantilla."""
    resultado = precio_service.actualizar_precios_de_plantillas(db)
    return resultado


@router.get("/{material_id}", response_model=MaterialOut)
def obtener(material_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return material_controller.get_one(db, material_id)


@router.post("/", response_model=MaterialOut, status_code=201)
def crear(data: MaterialCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return material_controller.create(db, data)


@router.put("/{material_id}", response_model=MaterialOut)
def actualizar(material_id: str, data: MaterialUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return material_controller.update(db, material_id, data)


@router.delete("/{material_id}")
def eliminar(material_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    return material_controller.delete(db, material_id)


@router.patch("/{material_id}/stock")
def ajustar_stock(material_id: str, cantidad: int = Query(..., description="Positivo para ingresar, negativo para retirar"), db: Session = Depends(get_db), _=Depends(require_admin)):
    return material_controller.ajustar_stock(db, material_id, cantidad)


@router.post("/{material_id}/actualizar-precio")
def actualizar_precio_uno(material_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    """Busca el precio en Sodimac para un material específico."""
    ok = precio_service.actualizar_precio_material(material_id, db)
    if not ok:
        return {"actualizado": False, "mensaje": "Sin resultados en Sodimac para este material"}
    return {"actualizado": True}


@router.post("/{material_id}/precio-manual")
def precio_manual(material_id: str, data: PrecioManualIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    """Guarda un precio Sodimac ingresado manualmente por el administrador."""
    ok = precio_service.guardar_precio_manual(material_id, data.precio, db)
    if not ok:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    return {"guardado": True}


@router.get("/{material_id}/historico-precios", response_model=List[PrecioHistoricoOut])
def historico_precios(
    material_id: str,
    dias: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Devuelve el histórico de precios Sodimac/manual de los últimos N días."""
    desde = datetime.utcnow() - timedelta(days=dias)
    registros = (
        db.query(MaterialPrecioHistorico)
        .filter(
            MaterialPrecioHistorico.material_id == material_id,
            MaterialPrecioHistorico.fecha >= desde,
        )
        .order_by(MaterialPrecioHistorico.fecha.desc())
        .all()
    )
    return registros