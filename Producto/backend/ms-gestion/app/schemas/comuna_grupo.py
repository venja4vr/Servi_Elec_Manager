from pydantic import BaseModel
from typing import Optional


class ComunaGrupoOut(BaseModel):
    id_cg:         str
    nombre:        str
    descripcion:   Optional[str]
    rango_km_min:  int
    rango_km_max:  int
    precio_por_km: int

    class Config:
        from_attributes = True
