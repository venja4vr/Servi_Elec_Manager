from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.utils.auth import get_current_user
from app.schemas.notificacion import NotificacionOut
from app.services import notificacion_service

router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


@router.get("/", response_model=List[NotificacionOut])
def listar(
    solo_no_leidas: bool = Query(False),
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
):
    return notificacion_service.listar_notificaciones(db, usuario["id_usuario"], solo_no_leidas)


@router.get("/contador")
def contador(db: Session = Depends(get_db), usuario=Depends(get_current_user)):
    total = notificacion_service.contador_no_leidas(db, usuario["id_usuario"])
    return {"total": total}


@router.patch("/{notificacion_id}/leida", response_model=NotificacionOut)
def marcar_leida(
    notificacion_id: str,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
):
    return notificacion_service.marcar_leida(db, notificacion_id, usuario["id_usuario"])


@router.patch("/marcar-todas-leidas")
def marcar_todas(db: Session = Depends(get_db), usuario=Depends(get_current_user)):
    actualizadas = notificacion_service.marcar_todas_leidas(db, usuario["id_usuario"])
    return {"actualizadas": actualizadas}
