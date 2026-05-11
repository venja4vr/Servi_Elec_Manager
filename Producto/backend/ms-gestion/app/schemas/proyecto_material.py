from pydantic import BaseModel
from typing import List
from decimal import Decimal


class MaterialPlaneado(BaseModel):
    material_id: str
    cantidad_planeada: Decimal


class ProyectoMaterialOut(BaseModel):
    proyecto_id: str
    material_id: str
    cantidad_planeada: Decimal

    class Config:
        from_attributes = True


class MaterialPlaneadoDetalle(BaseModel):
    material_id: str
    nombre_material: str
    cantidad_planeada: Decimal
    stock_actual: int
    precio_unitario: Decimal
    suficiente_stock: bool

    class Config:
        from_attributes = True