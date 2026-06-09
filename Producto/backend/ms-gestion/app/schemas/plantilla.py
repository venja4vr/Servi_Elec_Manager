from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal


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
    materiales: List[MaterialPlantillaIn] = []


class PlantillaUpdate(BaseModel):
    nombre_servicio: Optional[str] = Field(default=None, min_length=3, max_length=60)
    descripcion: Optional[str] = Field(default=None, max_length=200)
    categoria: Optional[str] = None
    activa: Optional[bool] = None
    precio_estimado: Optional[Decimal] = Field(default=None, ge=0)
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

    class Config:
        from_attributes = True


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
