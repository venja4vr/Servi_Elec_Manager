from pydantic import BaseModel
from typing import Optional

class PlantillaCreate(BaseModel):
    nombre_servicio: str
    descripcion: Optional[str] = None
    materiales_sugeridos: Optional[str] = None

class PlantillaUpdate(BaseModel):
    nombre_servicio: Optional[str] = None
    descripcion: Optional[str] = None
    materiales_sugeridos: Optional[str] = None

class PlantillaOut(BaseModel):
    id_plantilla: str
    nombre_servicio: str
    descripcion: Optional[str]
    materiales_sugeridos: Optional[str]

    class Config:
        from_attributes = True