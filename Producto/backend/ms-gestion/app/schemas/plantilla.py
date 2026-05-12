from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal


class PlantillaCreate(BaseModel):
    nombre_servicio: str
    descripcion: Optional[str] = None
    materiales_sugeridos: Optional[str] = None
    precio_estimado: Optional[Decimal] = Field(default=None, ge=0)


class PlantillaUpdate(BaseModel):
    nombre_servicio: Optional[str] = None
    descripcion: Optional[str] = None
    materiales_sugeridos: Optional[str] = None
    precio_estimado: Optional[Decimal] = Field(default=None, ge=0)


class PlantillaOut(BaseModel):
    id_plantilla: str
    nombre_servicio: str
    descripcion: Optional[str]
    materiales_sugeridos: Optional[str]
    precio_estimado: Optional[Decimal]

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