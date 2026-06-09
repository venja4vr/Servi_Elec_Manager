from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime


class PrecioHistoricoOut(BaseModel):
    material_id: str
    precio: Decimal
    fuente: str
    fecha: datetime

    class Config:
        from_attributes = True
