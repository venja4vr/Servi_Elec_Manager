"""
Servicio del comparador de precios externos.

Tiendas soportadas:
- Sodimac: scraping en vivo vía __NEXT_DATA__ (scraper_sodimac).
- Easy:    API REST pública VTEX (scraper_easy).

Cuando no se filtra por tienda, ambas búsquedas corren en paralelo
(scraper_service) y los resultados se devuelven ordenados por precio.
"""

from app.services.scraper_sodimac import buscar_en_sodimac
from app.services.scraper_easy import buscar_en_easy
from app.services import scraper_service


def buscar_productos(query: str = "", tienda: str = "") -> list[dict]:
    """Busca productos en las tiendas externas según query y tienda opcional.

    Args:
        query:  texto libre de búsqueda. Si está vacío, devuelve [].
        tienda: "Sodimac", "Easy" para filtrar, o "" para ambas en paralelo.

    Returns:
        Lista de productos con campos: codigo, nombre, marca, precio, tienda, imagen, url.
        Ordenados por precio ascendente.
    """
    if not query or not query.strip():
        return []

    tienda_lower = tienda.lower().strip()

    if tienda_lower == "sodimac":
        resultados = buscar_en_sodimac(query)
    elif tienda_lower == "easy":
        resultados = buscar_en_easy(query)
    else:
        return scraper_service.buscar_productos_multiple(query)

    return sorted(resultados, key=lambda p: p["precio"] if p["precio"] is not None else float("inf"))
