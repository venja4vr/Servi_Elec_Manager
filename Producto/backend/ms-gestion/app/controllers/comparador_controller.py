from app.services import comparador_service

def buscar(query: str = "", tienda: str = ""):
    return comparador_service.buscar_productos(query, tienda)