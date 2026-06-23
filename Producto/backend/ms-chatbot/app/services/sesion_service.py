from datetime import datetime, timedelta
from typing import Dict
from app.models.sesion import SesionChat, EstadoChat
from app.core.config import SESSION_TTL_MINUTES


# Diccionario global en memoria: telefono → SesionChat
# Mientras el servidor esté corriendo, este diccionario persiste
# Si se reinicia el servidor, las sesiones se pierden
_sesiones: Dict[str, SesionChat] = {}


def obtener_sesion(telefono: str) -> SesionChat:
     # Limpia sesiones viejas antes de buscar
    _limpiar_expiradas()
    # Si el cliente no tiene sesión, crea una nueva
    if telefono not in _sesiones:
        _sesiones[telefono] = SesionChat(telefono=telefono)
    return _sesiones[telefono]


def guardar_sesion(sesion: SesionChat) -> None:
    # Actualiza el timestamp y guarda
    sesion.actualizar()
    _sesiones[sesion.telefono] = sesion


def reiniciar_sesion(telefono: str) -> SesionChat:
    # Crea una sesión limpia pero ya en ESPERANDO_OPCION
    # (no en INICIO, para que no se vuelva a mostrar el menú infinitamente)
    sesion = SesionChat(telefono=telefono)
    sesion.estado = EstadoChat.ESPERANDO_OPCION
    _sesiones[telefono] = sesion
    return sesion


def listar_activas() -> list:
    # Para diagnóstico: ver qué clientes están en conversación
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
    # Elimina sesiones que llevan más de SESSION_TTL_MINUTES sin actividad
    # Por defecto 60 minutos
    limite = datetime.utcnow() - timedelta(minutes=SESSION_TTL_MINUTES)
    expiradas = [t for t, s in _sesiones.items() if s.ultimo_mensaje < limite]
    for t in expiradas:
        del _sesiones[t]