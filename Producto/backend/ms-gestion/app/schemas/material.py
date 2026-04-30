from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from app.schemas.categoria import CategoriaOut

class MaterialCreate(BaseModel):
    nombre_material: str
    descripcion: Optional[str] = None
    stock_actual: int = Field(default=0, ge=0)
    stock_critico: int = Field(default=0, ge=0)
    precio_unitario: Decimal = Field(default=0, ge=0)
    CATEGORIA_id_categoria: str

class MaterialUpdate(BaseModel):
    nombre_material: Optional[str] = None
    descripcion: Optional[str] = None
    stock_actual: Optional[int] = Field(default=None, ge=0)
    stock_critico: Optional[int] = Field(default=None, ge=0)
    precio_unitario: Optional[Decimal] = Field(default=None, ge=0)
    CATEGORIA_id_categoria: Optional[str] = None

class MaterialOut(BaseModel):
    id_material: str
    nombre_material: str
    descripcion: Optional[str]
    stock_actual: int
    stock_critico: int
    precio_unitario: Decimal
    CATEGORIA_id_categoria: str
    stock_bajo: bool
    categoria: Optional[CategoriaOut] = None

    class Config:
        from_attributes = True