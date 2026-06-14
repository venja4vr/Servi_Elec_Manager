"""
Scraper de Easy.cl para el comparador de precios.

Usa la API REST pública del tenant VTEX de Easy Chile (no requiere auth):
  https://easycl.vtexcommercestable.com.br/api/catalog_system/pub/products/search?ft={QUERY}&_from=N&_to=M&O=OrderByPriceASC

IMPORTANTE: La API devuelve exactamente 6 productos por llamada, sin importar
el valor de _to. Se hacen múltiples llamadas paginadas en paralelo.

Para probar con curl:
  curl -s "https://easycl.vtexcommercestable.com.br/api/catalog_system/pub/products/search?ft=interruptor&_from=0&_to=5&O=OrderByPriceASC"
  curl -s "https://easycl.vtexcommercestable.com.br/api/catalog_system/pub/products/search?ft=interruptor&_from=6&_to=11&O=OrderByPriceASC"

Estructura del JSON de respuesta:
  [{ productId, productName, brand, linkText,
     items: [{ images:[{imageUrl}], sellers:[{sellerDefault, commertialOffer:{Price, IsAvailable}}] }] }]

URL del producto en easy.cl: https://www.easy.cl/{linkText}/p
"""

import unicodedata
import concurrent.futures
from urllib.parse import quote

import requests


VTEX_BASE = "https://easycl.vtexcommercestable.com.br"
EASY_BASE = "https://www.easy.cl"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-CL,es;q=0.9",
}

TIMEOUT_SEGUNDOS = 12
PAGE_SIZE = 6  # La API VTEX de easycl devuelve máx 6 productos por llamada


# ============================================================
# UTILIDADES DE NORMALIZACIÓN Y RELEVANCIA
# ============================================================

def _normalizar(texto: str) -> str:
    if not texto:
        return ""
    nfkd = unicodedata.normalize("NFKD", texto)
    sin_acentos = "".join([c for c in nfkd if not unicodedata.combining(c)])
    return sin_acentos.lower().strip()


def _palabras_clave(termino: str, min_largo: int = 3) -> list[str]:
    if not termino:
        return []
    return [p for p in _normalizar(termino).split() if len(p) >= min_largo]


def _es_relevante(nombre: str, marca: str, palabras: list[str]) -> bool:
    if not palabras:
        return True
    texto = f"{_normalizar(nombre)} {_normalizar(marca)}"
    return any(p in texto for p in palabras)


# ============================================================
# EXTRACCIÓN DE DATOS DEL JSON VTEX
# ============================================================

def _limpiar_producto(p: dict) -> dict | None:
    """Transforma un producto crudo de la API VTEX al formato del sistema."""
    nombre = (p.get("productName") or "").strip()
    marca  = (p.get("brand") or "").strip()
    codigo = str(p.get("productId") or "")

    link_text = p.get("linkText") or ""
    url = f"{EASY_BASE}/{link_text}/p" if link_text else None

    precio = None
    imagen = None

    items = p.get("items", [])
    if items:
        primer_item = items[0]

        images = primer_item.get("images", [])
        if images:
            imagen = images[0].get("imageUrl")

        sellers = primer_item.get("sellers", [])
        seller = next((s for s in sellers if s.get("sellerDefault")), sellers[0] if sellers else None)
        if seller:
            oferta = seller.get("commertialOffer", {})
            if oferta.get("IsAvailable", False):
                raw = oferta.get("Price")
                if raw is not None:
                    try:
                        precio = int(round(float(raw)))
                    except (ValueError, TypeError):
                        precio = None

    return {
        "codigo": codigo,
        "nombre": nombre,
        "marca":  marca,
        "precio": precio,
        "tienda": "Easy",
        "imagen": imagen,
        "url":    url,
    }


# ============================================================
# LLAMADA A UNA SOLA PÁGINA DE LA API VTEX
# ============================================================

def _fetch_pagina(termino_url: str, desde: int) -> list[dict]:
    """Obtiene una página de resultados de la API VTEX. Devuelve [] si falla."""
    hasta = desde + PAGE_SIZE - 1
    url = (
        f"{VTEX_BASE}/api/catalog_system/pub/products/search"
        f"?ft={termino_url}&_from={desde}&_to={hasta}&O=OrderByPriceASC"
    )
    try:
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT_SEGUNDOS)
    except requests.RequestException as e:
        print(f"[scraper_easy] Error de red (página desde={desde}): {e}")
        return []

    if resp.status_code not in (200, 206):
        print(f"[scraper_easy] Warning: status {resp.status_code} (página desde={desde})")
        return []

    try:
        datos = resp.json()
    except Exception as e:
        print(f"[scraper_easy] Error parseando JSON (página desde={desde}): {e}")
        return []

    return datos if isinstance(datos, list) else []


# ============================================================
# FUNCIÓN PRINCIPAL DEL SCRAPER
# ============================================================

def buscar_en_easy(query: str, limit: int = 30) -> list[dict]:
    """Busca productos en Easy.cl usando la API VTEX pública con paginación paralela.

    La API devuelve exactamente PAGE_SIZE (6) productos por llamada. Se lanzan
    ceil(limit / PAGE_SIZE) llamadas en paralelo con offsets 0, 6, 12, ...
    Si una página falla, se omite y se devuelve lo que llegó del resto.

    Args:
        query: texto libre tipo 'cable thhn 2.5' o 'interruptor diferencial'.
        limit: máximo de productos a solicitar a la API (máx. recomendado: 30).

    Returns:
        Lista de dicts con campos: codigo, nombre, marca, precio, tienda, imagen, url.
        Si la búsqueda falla completamente, devuelve [] sin lanzar excepción.
    """
    if not query or not query.strip():
        return []

    termino_url = quote(query.strip())
    num_paginas = (limit + PAGE_SIZE - 1) // PAGE_SIZE  # ceil(limit / PAGE_SIZE)
    offsets = [i * PAGE_SIZE for i in range(num_paginas)]

    # Llamadas paralelas: una por página
    crudos: list[dict] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_paginas) as executor:
        futuros = {executor.submit(_fetch_pagina, termino_url, off): off for off in offsets}
        for futuro in concurrent.futures.as_completed(futuros):
            try:
                crudos.extend(futuro.result())
            except Exception as e:
                off = futuros[futuro]
                print(f"[scraper_easy] Excepción inesperada en página desde={off}: {e}")

    # Deduplicar por productId y aplicar filtros
    vistos: set[str] = set()
    palabras = _palabras_clave(query)
    productos_limpios = []

    for p in crudos:
        pid = str(p.get("productId") or "")
        if pid in vistos:
            continue
        vistos.add(pid)

        limpio = _limpiar_producto(p)
        if not limpio or not limpio["nombre"] or limpio["precio"] is None:
            continue
        if palabras and not _es_relevante(limpio["nombre"], limpio["marca"], palabras):
            continue
        productos_limpios.append(limpio)

    return productos_limpios
