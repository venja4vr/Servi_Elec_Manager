from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

# Estos son todos los estados posibles de una conversación
# El bot avanza de uno a otro según lo que escriba el cliente
class EstadoChat:
    INICIO              = "inicio" # Primer contacto, nunca visto antes
    ESPERANDO_OPCION    = "esperando_opcion" # Viendo el menú principal (1/2/3)
    ESPERANDO_CATEGORIA = "esperando_categoria" # Eligiendo categoría
    ESPERANDO_SERVICIO  = "esperando_servicio" # Eligiendo servicio
    COTIZACION_ENVIADA  = "cotizacion_enviada" # Precio mostrado, esperando OK
    RECOPILANDO_DATOS   = "recopilando_datos" # Haciendo preguntas de la ficha
    FINALIZADO          = "finalizado" # Proyecto creado


@dataclass # Crea automáticamente __init__, __repr__, etc.
class SesionChat:
    # Cada cliente tiene una SesionChat identificada por su número de teléfono
    telefono:          str
    estado:            str = EstadoChat.INICIO

    # Datos que se van guardando durante la conversación
    categoria_elegida: Optional[str] = None # "Instalaciones Eléctricas"
    plantilla_id:      Optional[str] = None # "PLA-TABLERO-12P"
    nombre_servicio:   Optional[str] = None # "Instalación de Tablero"
    precio_estimado:   Optional[float] = None # 195000.0

    # Datos de la ficha que llena el cliente
    nombre_cliente:    Optional[str] = None # "Carlos Iturrieta"
    direccion:         Optional[str] = None # "Calle Los Olivos 1420"
    comuna:            Optional[str] = None # "Quilpué"
    comuna_grupo_id:   Optional[str] = None # "zona_04_valpo" (resuelto por gestion_client)
    fecha_preferida:   Optional[str] = None
    observaciones:     Optional[str] = None # "ninguna"

    # Control interno
    paso_recopilacion: int = 0 # En qué pregunta de la ficha vamos (0,1,2,3)
    ultimo_mensaje:    datetime = field(default_factory=datetime.utcnow) 
    mapa_servicios:    dict = field(default_factory=dict) # {1: plantilla, 2: plantilla...}

    def actualizar(self):
        # Se llama cada vez que el cliente escribe algo
        # Sirve para saber cuándo fue el último mensaje y limpiar sesiones viejas
        self.ultimo_mensaje = datetime.utcnow()