from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CategoriaPlantillaIn(BaseModel):
    id_categoria: str = Field(..., min_length=1, max_length=32, pattern=r"^[a-z0-9_]+$")
    nombre: str = Field(..., min_length=2, max_length=80)


class CategoriaPlantillaUpdate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=80)


class CategoriaPlantillaOut(BaseModel):
    id_categoria: str
    nombre: str
    activa: bool
    fecha_creacion: Optional[datetime] = None

    class Config:
        from_attributes = True
