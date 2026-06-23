from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.notificacion import Notificacion
from app.schemas.notificacion import NotificacionCreate

# Throttle: tiempo mínimo entre notificaciones del mismo tipo para el mismo usuario
_THROTTLE_SEGUNDOS = 5


def _ultima_misma(db: Session, usuario_id: str, tipo: str) -> datetime | None:
    ultima = (
        db.query(Notificacion.creada_en)
        .filter(Notificacion.usuario_id == usuario_id, Notificacion.tipo == tipo)
        .order_by(Notificacion.creada_en.desc())
        .first()
    )
    return ultima[0] if ultima else None


def crear_notificacion(db: Session, data: NotificacionCreate) -> Notificacion | None:
    ahora = datetime.now(timezone.utc)
    ultima = _ultima_misma(db, data.usuario_id, data.tipo)

    if ultima is not None:
        if ultima.tzinfo is None:
            ultima = ultima.replace(tzinfo=timezone.utc)
        if (ahora - ultima).total_seconds() < _THROTTLE_SEGUNDOS:
            return None  # throttled

    n = Notificacion(
        usuario_id=data.usuario_id,
        tipo=data.tipo,
        titulo=data.titulo,
        mensaje=data.mensaje,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


def listar_notificaciones(db: Session, usuario_id: str, solo_no_leidas: bool = False):
    q = db.query(Notificacion).filter(Notificacion.usuario_id == usuario_id)
    if solo_no_leidas:
        q = q.filter(Notificacion.leida == False)
    return q.order_by(Notificacion.creada_en.desc()).limit(100).all()


def contador_no_leidas(db: Session, usuario_id: str) -> int:
    return (
        db.query(Notificacion)
        .filter(Notificacion.usuario_id == usuario_id, Notificacion.leida == False)
        .count()
    )


def marcar_leida(db: Session, notificacion_id: str, usuario_id: str) -> Notificacion:
    n = (
        db.query(Notificacion)
        .filter(
            Notificacion.id_notificacion == notificacion_id,
            Notificacion.usuario_id == usuario_id,
        )
        .first()
    )
    if not n:
        raise HTTPException(status_code=404, detail="Notificacion no encontrada")
    n.leida = True
    db.commit()
    db.refresh(n)
    return n


def marcar_todas_leidas(db: Session, usuario_id: str) -> int:
    actualizadas = (
        db.query(Notificacion)
        .filter(Notificacion.usuario_id == usuario_id, Notificacion.leida == False)
        .update({"leida": True})
    )
    db.commit()
    return actualizadas
