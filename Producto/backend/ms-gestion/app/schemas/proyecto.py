from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import date
from app.schemas.plantilla import PlantillaOut


class ProyectoCreate(BaseModel):
    nombre_proyecto: str
    tipo_proyecto: Optional[str] = None
    nombre_cliente: str
    telefono_cliente: Optional[str] = None
    direccion_cliente: Optional[str] = None
    fecha_inicio: Optional[date] = None
    estado: str = Field(default="pendiente", pattern="^(pendiente|en_curso|finalizado|cancelado)$")
    presupuesto_estimado: Optional[Decimal] = None
    presupuesto_final: Optional[Decimal] = None
    fecha_termino_maximo: Optional[date] = None
    plantilla_id: Optional[str] = None


class ProyectoUpdate(BaseModel):
    nombre_proyecto: Optional[str] = None
    tipo_proyecto: Optional[str] = None
    nombre_cliente: Optional[str] = None
    telefono_cliente: Optional[str] = None
    direccion_cliente: Optional[str] = None
    fecha_inicio: Optional[date] = None
    estado: Optional[str] = Field(default=None, pattern="^(pendiente|en_curso|finalizado|cancelado)$")
    presupuesto_estimado: Optional[Decimal] = None
    presupuesto_final: Optional[Decimal] = None
    fecha_termino_maximo: Optional[date] = None
    plantilla_id: Optional[str] = None


class ProyectoOut(BaseModel):
    id_proyecto: str
    nombre_proyecto: str
    tipo_proyecto: Optional[str]
    nombre_cliente: str
    telefono_cliente: Optional[str]
    direccion_cliente: Optional[str]
    fecha_inicio: Optional[date]
    estado: str
    presupuesto_estimado: Optional[Decimal]
    presupuesto_final: Optional[Decimal]
    fecha_termino_maximo: Optional[date]
    plantilla_id: Optional[str]
    plantilla: Optional[PlantillaOut] = None

    class Config:
        from_attributes = True