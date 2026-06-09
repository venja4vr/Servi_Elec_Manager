"""
Servicio del comparador de precios externos.

Versión actual: usa scraping en vivo de Sodimac. Cada búsqueda del usuario
gatilla una petición a sodimac.cl, extrae el bloque __NEXT_DATA__ y devuelve
productos reales con precio actualizado.

Tiendas soportadas:
- Sodimac: scraping en vivo (módulo scraper_sodimac).
- Easy: pendiente (devuelve lista vacía por ahora).
"""

from app.services.scraper_sodimac import buscar_en_sodimac


def buscar_productos(query: str = "", tienda: str = ""):
    """Busca productos en las tiendas externas según query y tienda opcional.

    Args:
        query: texto libre de búsqueda. Si es vacío, devuelve [].
        tienda: nombre de tienda para filtrar ("Sodimac", "Easy", o "" para todas).

    Returns:
        Lista de productos con campos: codigo, nombre, marca, precio, tienda, imagen, url.
    """
    # Sin query, no scrapeamos nada (evita peticiones innecesarias)
    if not query or not query.strip():
        return []

    resultados = []

    # Buscar en Sodimac si está seleccionada o si no hay filtro de tienda
    if not tienda or tienda.lower() == "sodimac":
        resultados.extend(buscar_en_sodimac(query))

    # Buscar en Easy si está seleccionada o si no hay filtro de tienda
    if not tienda or tienda.lower() == "easy":
        # TODO: implementar buscar_en_easy en próxima iteración
        pass

    return resultados