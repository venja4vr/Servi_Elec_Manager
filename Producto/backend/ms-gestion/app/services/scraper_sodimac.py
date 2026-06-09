"""
Scraper de Sodimac para el comparador de precios.
 
Hace web scraping de la página de búsqueda de Sodimac. Aprovecha el bloque
__NEXT_DATA__ que Sodimac inyecta en el HTML (Next.js SSR) para obtener
los productos como JSON estructurado, sin necesidad de Playwright.
 
Funcionamiento:
1. Construye la URL de búsqueda con el término del usuario.
2. Descarga la página con requests.
3. Extrae el bloque __NEXT_DATA__ del HTML.
4. Parsea el JSON y navega hasta props.pageProps.results.
5. Filtra productos patrocinados (isSponsored=True).
6. Aplica filtro de relevancia: el producto debe contener al menos una
   palabra clave del término de búsqueda (normalizado sin acentos).
7. Devuelve lista de productos limpios con campos estandarizados.
"""
 
import unicodedata
import json
from urllib.parse import quote
 
import requests
from bs4 import BeautifulSoup
 
 
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-CL,es;q=0.9",
}
 
TIMEOUT_SEGUNDOS = 15
 
 
# ============================================================
# UTILIDADES DE NORMALIZACIÓN Y RELEVANCIA
# ============================================================
 
def _normalizar(texto: str) -> str:
    """Quita acentos y pasa a minúsculas para comparaciones tolerantes."""
    if not texto:
        return ""
    nfkd = unicodedata.normalize("NFKD", texto)
    sin_acentos = "".join([c for c in nfkd if not unicodedata.combining(c)])
    return sin_acentos.lower().strip()
 
 
def _palabras_clave(termino: str, min_largo: int = 3) -> list[str]:
    """Extrae palabras útiles del término de búsqueda."""
    if not termino:
        return []
    normalizado = _normalizar(termino)
    palabras = normalizado.split()
    return [p for p in palabras if len(p) >= min_largo]
 
 
def _es_relevante(nombre: str, marca: str, palabras_busqueda: list[str]) -> bool:
    """Decide si un producto matchea con al menos una palabra clave."""
    if not palabras_busqueda:
        return True
    texto = f"{_normalizar(nombre)} {_normalizar(marca)}"
    return any(palabra in texto for palabra in palabras_busqueda)
 
 
# ============================================================
# EXTRACCIÓN DE DATOS DEL JSON DE SODIMAC
# ============================================================
 
def _extraer_precio(prices_list: list) -> int | None:
    """Convierte el primer precio del JSON de Sodimac a entero limpio.
    Sodimac entrega los precios como string con puntos: '44.464' -> 44464."""
    if not prices_list:
        return None
    primer_precio = prices_list[0]
    valor = primer_precio.get("price", [None])
    if not valor:
        return None
    precio_str = str(valor[0]).replace(".", "").replace(",", "").strip()
    try:
        return int(precio_str)
    except ValueError:
        return None
 
 
def _construir_url_imagen(producto: dict) -> str | None:
    """Intenta construir URL con varios métodos, en orden de confiabilidad."""
    
    # usar mediaUrls directo del JSON (más confiable)
    media_urls = producto.get("mediaUrls", [])
    if media_urls and len(media_urls) > 0:
        # la URL en mediaUrls termina en "/public", la reemplazamos por parámetros
        url_base = media_urls[0].replace("/public", "")
        return f"{url_base}/w=1200,h=1200,fit=pad"
    
    # opcion 2 usar sellerSkuId (para productos Sodimac)
    seller_sku_id = producto.get("sellerSkuId")
    if seller_sku_id:
        return f"https://media.falabella.com/sodimacCL/{seller_sku_id}_01/w=1200,h=1200,fit=pad"
    
    # OPCIÓN 3 usar skuId (fallback para otros productos)
    sku_id = producto.get("skuId")
    if sku_id:
        return f"https://media.falabella.com/falabellaCL/{sku_id}_01/w=1200,h=1200,fit=pad"
    
    # Si nada funciona, devolver None
    return None
 
 
def _limpiar_producto(p: dict) -> dict:
    """Transforma un producto crudo del JSON de Sodimac al formato del sistema."""
    return {
        "codigo": str(p.get("skuId")) if p.get("skuId") else None,
        "nombre": (p.get("displayName") or "").strip(),
        "marca": (p.get("brand") or "").strip(),
        "precio": _extraer_precio(p.get("prices", [])),
        "tienda": "Sodimac",
        "imagen": _construir_url_imagen(p),  # ← Pasas el PRODUCTO ENTERO, no solo sku_id
        "url": p.get("url"),
    }
 
 
# ============================================================
# FUNCIÓN PRINCIPAL DEL SCRAPER
# ============================================================
 
def buscar_en_sodimac(query: str) -> list[dict]:
    """Busca productos en Sodimac usando el término del usuario.
 
    Args:
        query: texto libre tipo 'cable thhn 2.5' o 'interruptor diferencial'.
 
    Returns:
        Lista de dicts con campos: codigo, nombre, marca, precio, tienda, imagen, url.
        Si la búsqueda falla o no hay resultados relevantes, devuelve [].
    """
    if not query or not query.strip():
        return []
 
    # 1. Construir URL de búsqueda
    termino_url = quote(query.strip())
    url = f"https://www.sodimac.cl/sodimac-cl/buscar?Ntt={termino_url}"
 
    # 2. Pedir la página con manejo de errores de red
    try:
        response = requests.get(url, headers=HEADERS, timeout=TIMEOUT_SEGUNDOS)
    except requests.RequestException as e:
        print(f"[scraper_sodimac] Error de red: {e}")
        return []
 
    if response.status_code != 200:
        print(f"[scraper_sodimac] Status no exitoso: {response.status_code}")
        return []
 
    # 3. Extraer bloque __NEXT_DATA__
    soup = BeautifulSoup(response.content, "lxml", from_encoding="utf-8")
    next_data_tag = soup.find("script", id="__NEXT_DATA__")
    if not next_data_tag or not next_data_tag.string:
        print("[scraper_sodimac] No se encontró el bloque __NEXT_DATA__")
        return []
 
    # 4. Parsear JSON
    try:
        data = json.loads(next_data_tag.string)
    except json.JSONDecodeError as e:
        print(f"[scraper_sodimac] Error parseando JSON: {e}")
        return []
 
    productos_crudos = (
        data.get("props", {})
            .get("pageProps", {})
            .get("results", [])
    )
 
    if not productos_crudos:
        return []
 
    # 5. Filtrar sponsored y limpiar
    productos_limpios = []
    for p in productos_crudos:
        if p.get("isSponsored", False):
            continue
        limpio = _limpiar_producto(p)
        # Descartar productos sin precio o nombre (datos corruptos)
        if not limpio["nombre"] or limpio["precio"] is None:
            continue
        productos_limpios.append(limpio)
 
    # 6. Filtro de relevancia contra el término original
    palabras = _palabras_clave(query)
    if palabras:
        productos_limpios = [
            p for p in productos_limpios
            if _es_relevante(p["nombre"], p["marca"], palabras)
        ]
 
    return productos_limpios
 