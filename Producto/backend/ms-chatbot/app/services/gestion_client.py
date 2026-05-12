import httpx
from typing import Optional, List, Dict, Any
from app.core.config import MS_GESTION_URL, MS_GESTION_TOKEN


def _headers() -> dict:
     # El JWT del admin se manda en cada request como Authorization: Bearer <token>
    return {"Authorization": f"Bearer {MS_GESTION_TOKEN}"}


def _url(path: str) -> str:
    # Construye la URL completa: "http://localhost:8000" + "/plantillas/"
    return f"{MS_GESTION_URL.rstrip('/')}{path}"


def obtener_plantillas() -> List[Dict[str, Any]]:
    # Llama a GET /plantillas/ de ms-gestion
    # Retorna la lista de plantillas o [] si falla
    try:
        r = httpx.get(_url("/plantillas/"), headers=_headers(), timeout=5)
        r.raise_for_status() # Lanza error si status >= 400
        return r.json()
    except Exception:
        return [] # Si falla, retorna lista vacía (el bot mostrará error)


def obtener_precio_plantilla(plantilla_id: str) -> Optional[float]:
    # Por ahora llama a GET /plantillas/{id} y busca "precio_estimado"
    # Cuando se implemente GET /plantillas/{id}/cotizacion,
    # esto se actualizará para llamar a ese endpoint
    try:
        r = httpx.get(_url(f"/plantillas/{plantilla_id}"), headers=_headers(), timeout=5)
        if r.status_code == 200:
            data = r.json()
            return data.get("precio_estimado") # None si no existe
        return None
    except Exception:
        return None


def crear_proyecto(
    nombre_cliente: str,
    telefono: str,
    plantilla_id: str,
    nombre_servicio: str,
    direccion: Optional[str] = None,
    fecha_preferida: Optional[str] = None,
    observaciones: Optional[str] = None,
    precio_estimado: Optional[float] = None,
) -> Optional[Dict[str, Any]]:
    payload = {
        # [:50] trunca a 50 caracteres para respetar el límite de la BD
        "nombre_proyecto": f"{nombre_servicio} — {nombre_cliente}"[:50],
        "tipo_proyecto": "Chatbot",  # Identifica que vino del bot
        "nombre_cliente": nombre_cliente,
        "estado": "pendiente", # El admin lo revisa antes de ejecutar
        "presupuesto_estimado": precio_estimado,
        "plantilla_id": plantilla_id,
    }
    try:
        r = httpx.post(_url("/proyectos/"), json=payload, headers=_headers(), timeout=10)
        r.raise_for_status()
        return r.json() # Retorna el proyecto creado con su id
    except Exception:
        return None # Si falla, el bot muestra mensaje de error