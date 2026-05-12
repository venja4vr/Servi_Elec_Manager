import httpx
import os
from typing import Optional, List, Dict, Any


def _headers() -> dict:
    token = os.getenv("MS_GESTION_TOKEN", "")
    return {"Authorization": f"Bearer {token}"}


def _url(path: str) -> str:
    base = os.getenv("MS_GESTION_URL", "http://localhost:8000")
    return f"{base.rstrip('/')}{path}"


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
            precio = data.get("precio_estimado")
            return float(precio) if precio else None
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

    # Primero obtener los materiales de la plantilla
    materiales = []
    try:
        r = httpx.get(_url(f"/plantillas/{plantilla_id}/materiales"),
                      headers=_headers(), timeout=5)
        if r.status_code == 200:
            data = r.json()
            materiales = [
                {
                    "material_id": m["material_id"],
                    "cantidad_planeada": float(m["cantidad_sugerida"])
                }
                for m in data.get("materiales", [])
            ]
    except Exception as e:
        print(f"[GESTION] No se pudieron obtener materiales: {e}")

    # Construir payload usando con-materiales si hay materiales, sino el simple
    if materiales:
        endpoint = "/proyectos/con-materiales"
        payload = {
            "nombre_proyecto": f"{nombre_servicio} — {nombre_cliente}"[:50],
            "tipo_proyecto": "Chatbot",
            "nombre_cliente": nombre_cliente,
            "telefono_cliente": telefono,
            "direccion_cliente": direccion,
            "presupuesto_estimado": precio_estimado,
            "plantilla_id": plantilla_id,
            "materiales": materiales,
        }
    else:
        endpoint = "/proyectos/"
        payload = {
            "nombre_proyecto": f"{nombre_servicio} — {nombre_cliente}"[:50],
            "tipo_proyecto": "Chatbot",
            "nombre_cliente": nombre_cliente,
            "telefono_cliente": telefono,
            "direccion_cliente": direccion,
            "estado": "pendiente",
            "presupuesto_estimado": precio_estimado,
            "plantilla_id": plantilla_id,
        }

    try:
        r = httpx.post(_url(endpoint), json=payload, headers=_headers(), timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[GESTION ERROR] crear_proyecto: {e}")
        return None