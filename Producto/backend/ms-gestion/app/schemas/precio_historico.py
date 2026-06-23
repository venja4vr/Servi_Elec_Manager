from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from typing import Optional


class PrecioHistoricoOut(BaseModel):
    material_id: str
    precio: Decimal
    fuente: str
    tienda: Optional[str] = "Sodimac"
    es_outlier: bool = False
    fecha: datetime

    class Config:
        from_attributes = True
