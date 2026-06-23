from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime
from app.schemas.categoria import CategoriaOut

UNIDADES_COMPRA_VALIDAS = ["unidad", "metro", "rollo", "kilo", "litro"]


class MaterialCreate(BaseModel):
    nombre_material: str = Field(..., min_length=3, max_length=50)
    descripcion: Optional[str] = Field(default=None, max_length=250)
    stock_actual: int = Field(default=0, ge=0)
    stock_critico: int = Field(default=0, ge=0)
    precio_unitario: Decimal = Field(default=0, ge=0)
    categoria_id: str
    unidad_compra: str = Field(default="unidad", pattern=r"^(unidad|metro|rollo|kilo|litro)$")

class MaterialUpdate(BaseModel):
    nombre_material: Optional[str] = Field(default=None, min_length=3, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    stock_actual: Optional[int] = Field(default=None, ge=0)
    stock_critico: Optional[int] = Field(default=None, ge=0)
    precio_unitario: Optional[Decimal] = Field(default=None, ge=0)
    categoria_id: Optional[str] = None
    unidad_compra: Optional[str] = Field(default=None, pattern=r"^(unidad|metro|rollo|kilo|litro)$")

class MaterialOut(BaseModel):
    id_material: str
    nombre_material: str
    descripcion: Optional[str]
    stock_actual: int
    stock_critico: int
    precio_unitario: Decimal
    categoria_id: str
    stock_bajo: bool
    unidad_compra: str = "unidad"
    categoria: Optional[CategoriaOut] = None
    precio_sodimac_actual: Optional[Decimal] = None
    precio_sodimac_actualizado: Optional[datetime] = None

    class Config:
        from_attributes = True