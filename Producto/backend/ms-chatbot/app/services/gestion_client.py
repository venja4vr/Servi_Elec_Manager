import httpx
from typing import Optional, List, Dict, Any
from app.core.config import MS_GESTION_URL, MS_GESTION_TOKEN


def _headers() -> dict:
    return {"Authorization": f"Bearer {MS_GESTION_TOKEN}"}


def _url(path: str) -> str:
    return f"{MS_GESTION_URL.rstrip('/')}{path}"


def obtener_plantillas() -> List[Dict[str, Any]]:
    try:
        r = httpx.get(_url("/plantillas/"), headers=_headers(), timeout=5)
        r.raise_for_status()
        return r.json()
    except Exception:
        return []


def obtener_precio_plantilla(plantilla_id: str) -> Optional[float]:
    try:
        r = httpx.get(_url(f"/plantillas/{plantilla_id}"), headers=_headers(), timeout=5)
        if r.status_code == 200:
            data = r.json()
            return data.get("precio_estimado")
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
        "nombre_proyecto": f"{nombre_servicio} — {nombre_cliente}"[:50],
        "tipo_proyecto": "Chatbot",
        "nombre_cliente": nombre_cliente,
        "estado": "pendiente",
        "presupuesto_estimado": precio_estimado,
        "plantilla_id": plantilla_id,
    }
    try:
        r = httpx.post(_url("/proyectos/"), json=payload, headers=_headers(), timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception:
        return None