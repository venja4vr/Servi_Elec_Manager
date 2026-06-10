from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal
from datetime import datetime


CATEGORIAS_VALIDAS = [
    "Instalaciones Eléctricas",
    "Mantenciones Eléctricas",
    "Servicios Industriales",
]


class MaterialPlantillaIn(BaseModel):
    material_id: str
    cantidad_sugerida: Decimal = Field(..., gt=0)
    unidad: str = "unidad"


class PlantillaCreate(BaseModel):
    nombre_servicio: str = Field(..., min_length=3, max_length=60)
    descripcion: Optional[str] = Field(default=None, max_length=200)
    categoria: Optional[str] = None
    activa: bool = True
    precio_estimado: Optional[Decimal] = Field(default=None, ge=0)
    dias_default: Optional[int] = Field(default=1, ge=1)
    materiales: List[MaterialPlantillaIn] = []


class PlantillaUpdate(BaseModel):
    nombre_servicio: Optional[str] = Field(default=None, min_length=3, max_length=60)
    descripcion: Optional[str] = Field(default=None, max_length=200)
    categoria: Optional[str] = None
    activa: Optional[bool] = None
    precio_estimado: Optional[Decimal] = Field(default=None, ge=0)
    dias_default: Optional[int] = Field(default=None, ge=1)
    materiales: Optional[List[MaterialPlantillaIn]] = None


class PlantillaOut(BaseModel):
    id_plantilla: str
    nombre_servicio: str
    descripcion: Optional[str]
    materiales_sugeridos: Optional[str]
    precio_estimado: Optional[Decimal]
    categoria: Optional[str]
    activa: bool = True
    num_materiales: int = 0
    dias_default: Optional[int] = 1

    class Config:
        from_attributes = True


# ── Cotización ────────────────────────────────────────────────────────────────

class MaterialCotizacionOut(BaseModel):
    nombre_material: str
    cantidad: Decimal
    unidad: str
    precio_unitario: Optional[Decimal]
    subtotal: Optional[Decimal]
    sin_precio: bool

    class Config:
        from_attributes = True


class CotizacionPlantillaOut(BaseModel):
    plantilla_id: str
    nombre_servicio: str
    descripcion: Optional[str]
    materiales: List[MaterialCotizacionOut]
    total_estimado: Decimal
    materiales_sin_precio: List[str]  # nombres de los materiales sin precio

    class Config:
        from_attributes = True


# ── Materiales vinculados (endpoint /materiales) ──────────────────────────────

# Schema para devolver un material vinculado a una plantilla
class MaterialVinculadoOut(BaseModel):
    material_id: str
    nombre_material: str
    cantidad_sugerida: Decimal
    unidad: str
    stock_actual: int
    stock_critico: int
    precio_unitario: Decimal
    suficiente_stock: bool

    class Config:
        from_attributes = True


# Schema para devolver una plantilla con sus materiales vinculados
class PlantillaConMaterialesOut(BaseModel):
    id_plantilla: str
    nombre_servicio: str
    descripcion: Optional[str]
    precio_estimado: Optional[Decimal]
    materiales: List[MaterialVinculadoOut]

    class Config:
        from_attributes = True
