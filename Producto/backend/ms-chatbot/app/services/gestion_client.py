import httpx
import os
from typing import Optional, List, Dict, Any
from datetime import datetime


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

    # Formatos comunes que intentaremos parsear
    formatos = [
        "%d/%m/%Y",        # 25/12/2026
        "%d-%m-%Y",        # 25-12-2026
        "%d/%m/%y",        # 25/12/26
        "%Y-%m-%d",        # 2026-12-25
        "%d de %B de %Y",  # 25 de diciembre de 2026
        "%d de %B",        # 25 de diciembre (asume año actual)
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


def _limpiar_observaciones(texto: Optional[str]) -> Optional[str]:
    """
    Si el cliente respondió 'ninguna', 'no', 'nada' u algo similar,
    devolvemos None en vez del texto literal.
    Si el texto es válido, lo recortamos a 500 caracteres (límite de la BD).
    """
    if not texto:
        return None

    t = texto.strip().lower()
    no_observaciones = ["ninguna", "ninguno", "nada", "no", "sin observaciones", "sin obs", "n/a", "no tengo"]

    if t in no_observaciones:
        return None

    # Recortar a 500 chars por si el cliente escribió mucho
    return texto.strip()[:500]


def _headers() -> dict:
    token = os.getenv("MS_GESTION_TOKEN", "")
    return {"Authorization": f"Bearer {token}"}


def _url(path: str) -> str:
    base = os.getenv("MS_GESTION_URL", "http://localhost:8000")
    return f"{base.rstrip('/')}{path}"


def obtener_categorias_con_plantillas() -> List[Dict[str, Any]]:
    """Devuelve categorías activas que tienen al menos 1 plantilla activa."""
    try:
        r = httpx.get(
            _url("/categoria-plantilla/?solo_con_plantillas=true"),
            headers=_headers(),
            timeout=5,
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[GESTION] obtener_categorias_con_plantillas error: {e}")
        return []


def obtener_plantillas() -> List[Dict[str, Any]]:
    try:
        r = httpx.get(_url("/plantillas/"), headers=_headers(), timeout=5)
        r.raise_for_status()
        return r.json()
    except Exception:
        return []


def obtener_plantillas_por_categoria(categoria_nombre: str) -> Optional[List[Dict[str, Any]]]:
    """Devuelve plantillas activas de una categoría. None si ms-gestion no responde."""
    try:
        from urllib.parse import quote
        r = httpx.get(
            _url(f"/plantillas/categoria/{quote(categoria_nombre)}"),
            headers=_headers(),
            timeout=5,
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[GESTION] obtener_plantillas_por_categoria error: {e}")
        return None


# Mapa local: nombre normalizado de comuna → id_cg del grupo de distancia.
# Se usa para no depender de búsqueda por texto en ms-gestion.
_COMUNA_A_GRUPO_ID: Dict[str, str] = {
    # Zona 1 — Local (0-15 km)
    "la calera": "zona_01_local",
    "la cruz":   "zona_01_local",
    "san pedro": "zona_01_local",
    "quillota":  "zona_01_local",
    # Zona 2 — Próxima (16-35 km)
    "hijuelas": "zona_02_proxima",
    "nogales":  "zona_02_proxima",
    "limache":  "zona_02_proxima",
    "olmué":    "zona_02_proxima",
    "olmue":    "zona_02_proxima",
    # Zona 3 — Semi-media (36-55 km)
    "catemu":        "zona_03_semi",
    "llaillay":      "zona_03_semi",
    "quilpué":       "zona_03_semi",
    "quilpue":       "zona_03_semi",
    "villa alemana": "zona_03_semi",
    # Zona 4 — Valparaíso y Costa Norte (56-72 km)
    "san felipe":   "zona_04_valpo",
    "panquehue":    "zona_04_valpo",
    "santa maría":  "zona_04_valpo",
    "santa maria":  "zona_04_valpo",
    "casablanca":   "zona_04_valpo",
    "concón":       "zona_04_valpo",
    "concon":       "zona_04_valpo",
    "viña del mar": "zona_04_valpo",
    "vina del mar": "zona_04_valpo",
    "valparaíso":   "zona_04_valpo",
    "valparaiso":   "zona_04_valpo",
    "puchuncaví":   "zona_04_valpo",
    "puchuncavi":   "zona_04_valpo",
    "quintero":     "zona_04_valpo",
    # Zona 5 — Andes e Interior (73-90 km)
    "rinconada":   "zona_05_andes",
    "calle larga": "zona_05_andes",
    "los andes":   "zona_05_andes",
    "san esteban": "zona_05_andes",
    "putaendo":    "zona_05_andes",
    # Zona 6 — Costa Sur Media (91-110 km)
    "algarrobo": "zona_06_costa_media",
    "el quisco": "zona_06_costa_media",
    "el tabo":   "zona_06_costa_media",
    # Zona 7 — San Antonio (111-125 km)
    "cartagena":   "zona_07_san_antonio",
    "san antonio": "zona_07_san_antonio",
    # Zona 8 — Extremo Sur (126-145 km)
    "santo domingo": "zona_08_extremo",
}


def obtener_comuna_grupo_por_nombre(nombre: str) -> Optional[Dict[str, Any]]:
    """
    Devuelve el grupo-comuna (dict con id_cg, nombre, rango_km, etc.) que corresponde
    al nombre de la comuna, consultando ms-gestion. Devuelve None si la comuna no tiene
    grupo asignado o ms-gestion no responde.
    """
    grupo_id = _COMUNA_A_GRUPO_ID.get(nombre.strip().lower())
    if not grupo_id:
        return None
    try:
        r = httpx.get(_url(f"/comuna-grupos/{grupo_id}"), headers=_headers(), timeout=5)
        if r.status_code == 200:
            return r.json()
        return None
    except Exception as e:
        print(f"[GESTION] obtener_comuna_grupo_por_nombre error: {e}")
        return None


def obtener_cotizacion_plantilla(plantilla_id: str) -> Optional[Dict[str, Any]]:
    """Devuelve la cotizacion calculada (total con precios Sodimac) de una plantilla."""
    try:
        r = httpx.get(_url(f"/plantillas/{plantilla_id}/cotizacion"), headers=_headers(), timeout=5)
        if r.status_code == 200:
            return r.json()
        return None
    except Exception as e:
        print(f"[GESTION] obtener_cotizacion_plantilla error: {e}")
        return None


def obtener_bencina_referencia(dias: int = 5) -> Optional[float]:
    """Estima costo de bencina para zona media (zona_04_valpo) como referencia en cotizaciones pre-registro."""
    try:
        r = httpx.get(_url("/comuna-grupos/zona_04_valpo"), headers=_headers(), timeout=5)
        if r.status_code == 200:
            g = r.json()
            km = (g["rango_km_min"] + g["rango_km_max"]) / 2
            return km * 2 * g["precio_por_km"] * dias
        return None
    except Exception as e:
        print(f"[GESTION] obtener_bencina_referencia error: {e}")
        return None


def obtener_costo_bencina_grupo(grupo_id: str, dias: int) -> Optional[float]:
    """Calcula costo de bencina para un grupo de zona específico y cantidad de días."""
    try:
        r = httpx.get(_url(f"/comuna-grupos/{grupo_id}"), headers=_headers(), timeout=5)
        if r.status_code == 200:
            g = r.json()
            km = (g["rango_km_min"] + g["rango_km_max"]) / 2
            return km * 2 * g["precio_por_km"] * dias
        return None
    except Exception as e:
        print(f"[GESTION] obtener_costo_bencina_grupo error: {e}")
        return None


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
    comuna: Optional[str] = None,
    comuna_grupo_id: Optional[str] = None,
    fecha_preferida: Optional[str] = None,
    observaciones: Optional[str] = None,
    precio_estimado: Optional[float] = None,
    dias_estimados: Optional[int] = None,
    horas_diarias: Optional[int] = None,
) -> Optional[Dict[str, Any]]:

    # Procesar fecha_preferida y observaciones
    fecha_inicio_final = _parsear_fecha(fecha_preferida)
    observaciones_final = _limpiar_observaciones(observaciones)

    # Combinar calle + comuna en un solo campo
    if direccion and comuna:
        direccion_completa = f"{direccion}, {comuna}"
    elif direccion:
        direccion_completa = direccion
    elif comuna:
        direccion_completa = comuna
    else:
        direccion_completa = None

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

    # Construir payload
    if materiales:
        endpoint = "/proyectos/con-materiales"
        payload = {
            "nombre_proyecto": f"{nombre_servicio} — {nombre_cliente}"[:50],
            "tipo_proyecto": "Chatbot",
            "nombre_cliente": nombre_cliente,
            "telefono_cliente": telefono,
            "direccion_cliente": direccion_completa,
            "fecha_inicio": fecha_inicio_final,
            "presupuesto_estimado": precio_estimado,
            "plantilla_id": plantilla_id,
            "observaciones": observaciones_final,
            "materiales": materiales,
            "comuna_grupo_id": comuna_grupo_id,
            "dias_estimados": dias_estimados,
            "horas_diarias": horas_diarias,
        }
    else:
        endpoint = "/proyectos/"
        payload = {
            "nombre_proyecto": f"{nombre_servicio} — {nombre_cliente}"[:50],
            "tipo_proyecto": "Chatbot",
            "nombre_cliente": nombre_cliente,
            "telefono_cliente": telefono,
            "direccion_cliente": direccion_completa,
            "fecha_inicio": fecha_inicio_final,
            "estado": "pendiente",
            "presupuesto_estimado": precio_estimado,
            "plantilla_id": plantilla_id,
            "observaciones": observaciones_final,
            "comuna_grupo_id": comuna_grupo_id,
            "dias_estimados": dias_estimados,
            "horas_diarias": horas_diarias,
        }

    try:
        r = httpx.post(_url(endpoint), json=payload, headers=_headers(), timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[GESTION ERROR] crear_proyecto: {e}")
        return None