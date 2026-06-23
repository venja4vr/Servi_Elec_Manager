"""
Orquestador de scrapers: busca en Sodimac y Easy en paralelo.

Usa ThreadPoolExecutor para ejecutar ambos scrapers síncronos simultáneamente.
Si una tienda falla, devuelve solo los resultados de la otra.
"""

import concurrent.futures

from app.services.scraper_sodimac import buscar_en_sodimac
from app.services.scraper_easy import buscar_en_easy


def buscar_productos_multiple(query: str) -> list[dict]:
    """Busca en Sodimac y Easy en paralelo y combina resultados ordenados por precio.

    Args:
        query: texto libre de búsqueda.

    Returns:
        Lista combinada de productos de ambas tiendas, ordenados por precio ascendente.
        Productos sin precio quedan al final.
    """
    resultados_sodimac: list[dict] = []
    resultados_easy: list[dict]    = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        fut_sodimac = executor.submit(buscar_en_sodimac, query)
        fut_easy    = executor.submit(buscar_en_easy, query)

        try:
            resultados_sodimac = fut_sodimac.result(timeout=20)
        except Exception as e:
            print(f"[scraper_service] Sodimac falló: {e}")

        try:
            resultados_easy = fut_easy.result(timeout=20)
        except Exception as e:
            print(f"[scraper_service] Easy falló: {e}")

    combinados = resultados_sodimac + resultados_easy
    combinados.sort(key=lambda p: p["precio"] if p["precio"] is not None else float("inf"))
    return combinados
