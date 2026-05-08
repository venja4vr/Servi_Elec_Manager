from datetime import datetime, timedelta
from typing import Dict
from app.models.sesion import SesionChat, EstadoChat
from app.core.config import SESSION_TTL_MINUTES

_sesiones: Dict[str, SesionChat] = {}


def obtener_sesion(telefono: str) -> SesionChat:
    _limpiar_expiradas()
    if telefono not in _sesiones:
        _sesiones[telefono] = SesionChat(telefono=telefono)
    return _sesiones[telefono]


def guardar_sesion(sesion: SesionChat) -> None:
    sesion.actualizar()
    _sesiones[sesion.telefono] = sesion


def reiniciar_sesion(telefono: str) -> SesionChat:
    sesion = SesionChat(telefono=telefono)
    sesion.estado = EstadoChat.ESPERANDO_OPCION
    _sesiones[telefono] = sesion
    return sesion


def listar_activas() -> list:
    return [
        {
            "telefono": s.telefono,
            "estado": s.estado,
            "servicio": s.nombre_servicio,
            "ultimo_mensaje": s.ultimo_mensaje.isoformat(),
        }
        for s in _sesiones.values()
    ]


def _limpiar_expiradas() -> None:
    limite = datetime.utcnow() - timedelta(minutes=SESSION_TTL_MINUTES)
    expiradas = [t for t, s in _sesiones.items() if s.ultimo_mensaje < limite]
    for t in expiradas:
        del _sesiones[t]