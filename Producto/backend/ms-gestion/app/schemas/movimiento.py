from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class MovimientoCreate(BaseModel):
    cantidad: int = Field(..., gt=0)
    PROYECTO_id_proyecto: str
    MATERIAL_id_material: str
    USUARIO_id_usuario: str

class MovimientoOut(BaseModel):
    id_movimiento: str
    cantidad: int
    fecha_salida: datetime
    PROYECTO_id_proyecto: str
    MATERIAL_id_material: str
    USUARIO_id_usuario: str

    class Config:
        from_attributes = True