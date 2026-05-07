from pydantic import BaseModel, Field
from datetime import datetime


class MovimientoCreate(BaseModel):
    cantidad: int = Field(..., gt=0)
    proyecto_id: str
    material_id: str


class MovimientoOut(BaseModel):
    id_movimiento: str
    cantidad: int
    fecha_salida: datetime
    proyecto_id: str
    material_id: str
    usuario_id: str

    class Config:
        from_attributes = True