import httpx
import os
from typing import Optional, List, Dict, Any

def _parsear_fecha(texto: Optional[str]) -> Optional[str]:
    """
    Intenta convertir el texto del cliente en una fecha ISO (YYYY-MM-DD).
    Acepta varios formatos comunes en español.
    Si no se puede parsear o el cliente dijo 'sin preferencia', devuelve None.
    """
    if not texto:
        return None

    texto = texto.strip().lower()

    # Casos donde el cliente NO especifica fecha
    no_fechas = ["sin preferencia", "sin", "ninguna", "no", "no tengo", "cuando puedan", "cualquier", "lo antes posible"]
    if any(p in texto for p in no_fechas):
        return None

    from datetime import datetime

    # Formatos comunes que intentaremos parsear
    formatos = [
        "%d/%m/%Y",     # 25/12/2026
        "%d-%m-%Y",     # 25-12-2026
        "%d/%m/%y",     # 25/12/26
        "%Y-%m-%d",     # 2026-12-25
        "%d de %B de %Y",  # 25 de diciembre de 2026
        "%d de %B",     # 25 de diciembre (asume año actual)
    ]

    for fmt in formatos:
        try:
            fecha = datetime.strptime(texto, fmt)
            # Si no especificó año, asumir año actual
            if fecha.year == 1900:
                fecha = fecha.replace(year=datetime.now().year)
            return fecha.strftime("%Y-%m-%d")
        except ValueError:
            continue

    # Si no pudimos parsearlo, devolver None (no romper, solo ignorar)
    print(f"[GESTION] No se pudo parsear fecha: '{texto}'")
    return None

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

    # Procesar fecha_preferida: si el cliente escribió "sin preferencia", null. Si escribió fecha, intentamos parsearla.
    fecha_inicio_final = _parsear_fecha(fecha_preferida)

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
            "fecha_inicio": fecha_inicio_final,
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
            "fecha_inicio": fecha_inicio_final,
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