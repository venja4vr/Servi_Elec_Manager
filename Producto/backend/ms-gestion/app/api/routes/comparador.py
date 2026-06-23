from fastapi import APIRouter, Depends, Query
from app.controllers import comparador_controller
from app.utils.auth import get_current_user

router = APIRouter(prefix="/buscador", tags=["Buscador de Precios"])

@router.get("/")
def buscar(
    query: str = Query("", description="Texto a buscar en nombre o marca del producto"),
    tienda: str = Query("", description="Filtrar por tienda: Sodimac o Easy"),
    _=Depends(get_current_user)
):
    return comparador_controller.buscar(query, tienda)