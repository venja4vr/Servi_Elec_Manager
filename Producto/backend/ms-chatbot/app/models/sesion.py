from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


class EstadoChat:
    INICIO              = "inicio"
    ESPERANDO_OPCION    = "esperando_opcion"
    ESPERANDO_CATEGORIA = "esperando_categoria"
    ESPERANDO_SERVICIO  = "esperando_servicio"
    COTIZACION_ENVIADA  = "cotizacion_enviada"
    RECOPILANDO_DATOS   = "recopilando_datos"
    FINALIZADO          = "finalizado"


@dataclass
class SesionChat:
    telefono:          str
    estado:            str = EstadoChat.INICIO
    categoria_elegida: Optional[str] = None
    plantilla_id:      Optional[str] = None
    nombre_servicio:   Optional[str] = None
    precio_estimado:   Optional[float] = None
    nombre_cliente:    Optional[str] = None
    direccion:         Optional[str] = None
    fecha_preferida:   Optional[str] = None
    observaciones:     Optional[str] = None
    paso_recopilacion: int = 0
    ultimo_mensaje:    datetime = field(default_factory=datetime.utcnow)
    mapa_servicios:    dict = field(default_factory=dict)

    def actualizar(self):
        self.ultimo_mensaje = datetime.utcnow()