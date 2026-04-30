from pydantic import BaseModel
from typing import Optional
from app.schemas.categoria import CategoriaOut

class PlantillaCreate(BaseModel):
    nombre_servicio: str
    descripcion: Optional[str] = None
    materiales_sugeridos: Optional[str] = None
    CATEGORIA_id_categoria: str

class PlantillaUpdate(BaseModel):
    nombre_servicio: Optional[str] = None
    descripcion: Optional[str] = None
    materiales_sugeridos: Optional[str] = None
    CATEGORIA_id_categoria: Optional[str] = None

class PlantillaOut(BaseModel):
    id_plantilla: str
    nombre_servicio: str
    descripcion: Optional[str]
    materiales_sugeridos: Optional[str]
    CATEGORIA_id_categoria: str
    categoria: Optional[CategoriaOut] = None

    class Config:
        from_attributes = True