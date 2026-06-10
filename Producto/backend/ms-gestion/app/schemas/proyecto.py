import re
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List
from decimal import Decimal
from datetime import date
from app.schemas.plantilla import PlantillaOut
from app.schemas.comuna_grupo import ComunaGrupoOut

_RE_TELEFONO_CL = re.compile(r'^(\+?56\s?)?9\s?\d{4}\s?\d{4}$|^569\d{8}$')


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
    observaciones: Optional[str] = None
    # Campos de costos (opcionales para compatibilidad)
    dias_estimados: Optional[int] = Field(default=None, ge=1)
    cantidad_trabajadores: Optional[int] = Field(default=None, ge=1)
    comuna_grupo_id: Optional[str] = None
    porcentaje_ganancia: Optional[Decimal] = Field(default=None, ge=0)
    precio_dia_trabajador: Optional[Decimal] = Field(default=None, ge=0)


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
    observaciones: Optional[str] = None
    # Campos de costos (opcionales para compatibilidad)
    dias_estimados: Optional[int] = Field(default=None, ge=1)
    cantidad_trabajadores: Optional[int] = Field(default=None, ge=1)
    comuna_grupo_id: Optional[str] = None
    porcentaje_ganancia: Optional[Decimal] = Field(default=None, ge=0)
    precio_dia_trabajador: Optional[Decimal] = Field(default=None, ge=0)

    @field_validator("nombre_proyecto")
    @classmethod
    def validar_nombre_proyecto(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) < 3 or len(v) > 50:
                raise ValueError("El nombre del proyecto debe tener entre 3 y 50 caracteres")
        return v

    @field_validator("nombre_cliente")
    @classmethod
    def validar_nombre_cliente(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) < 3 or len(v) > 50:
                raise ValueError("El nombre del cliente debe tener entre 3 y 50 caracteres")
        return v

    @field_validator("telefono_cliente")
    @classmethod
    def validar_telefono(cls, v):
        if v is not None and v.strip():
            normalizado = re.sub(r'[\s\+\-\(\)]', '', v.strip())
            if not _RE_TELEFONO_CL.match(v.strip()) and not re.match(r'^569\d{8}$', normalizado) and not re.match(r'^9\d{8}$', normalizado):
                raise ValueError("Formato de teléfono inválido. Use +56 9 XXXX XXXX o 9 XXXX XXXX")
        return v

    @field_validator("presupuesto_estimado", "presupuesto_final")
    @classmethod
    def no_negativo(cls, v):
        if v is not None and v < 0:
            raise ValueError("El presupuesto no puede ser negativo")
        return v

    @field_validator("observaciones")
    @classmethod
    def validar_observaciones(cls, v):
        if v is not None and len(v) > 500:
            raise ValueError("Las observaciones no pueden superar 500 caracteres")
        return v

    @field_validator("direccion_cliente")
    @classmethod
    def validar_direccion(cls, v):
        if v is not None and len(v) > 200:
            raise ValueError("La dirección no puede superar 200 caracteres")
        return v

    @model_validator(mode="after")
    def validar_fechas(self):
        if self.fecha_inicio and self.fecha_termino_maximo:
            if self.fecha_termino_maximo < self.fecha_inicio:
                raise ValueError("La fecha de término debe ser posterior a la fecha de inicio")
        return self


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
    observaciones: Optional[str]
    # Campos de costos
    dias_estimados: Optional[int] = None
    cantidad_trabajadores: Optional[int] = None
    comuna_grupo_id: Optional[str] = None
    porcentaje_ganancia: Optional[Decimal] = None
    precio_dia_trabajador: Optional[Decimal] = None
    plantilla: Optional[PlantillaOut] = None
    comuna_grupo: Optional[ComunaGrupoOut] = None

    class Config:
        from_attributes = True


# ── Costos ───────────────────────────────────────────────────────────────────

class ProyectoCostosUpdate(BaseModel):
    """Body para PUT /proyectos/{id}/costos — todos los campos son opcionales."""
    dias_estimados: Optional[int] = Field(default=None, ge=1)
    cantidad_trabajadores: Optional[int] = Field(default=None, ge=1)
    comuna_grupo_id: Optional[str] = None
    porcentaje_ganancia: Optional[Decimal] = Field(default=None, ge=0, le=100)
    precio_dia_trabajador: Optional[Decimal] = Field(default=None, ge=0)


class DetallesCostosOut(BaseModel):
    km_distancia: float
    dias_estimados: int
    cantidad_trabajadores: int
    precio_dia_trabajador: float
    porcentaje_ganancia: float
    comuna_grupo_id: Optional[str]


class ProyectoCostosOut(BaseModel):
    proyecto_id: str
    subtotal_materiales: Decimal
    costo_bencina: Decimal
    costo_mano_obra: Decimal
    subtotal_sin_ganancia: Decimal
    monto_ganancia: Decimal
    total_final: Decimal
    materiales_sin_precio: List[str]
    detalles: DetallesCostosOut


# Schema para crear proyecto CON sus materiales planeados
class ProyectoCreateConMateriales(BaseModel):
    nombre_proyecto: str
    tipo_proyecto: Optional[str] = None
    nombre_cliente: str
    telefono_cliente: Optional[str] = None
    direccion_cliente: Optional[str] = None
    fecha_inicio: Optional[date] = None
    presupuesto_estimado: Optional[Decimal] = None
    fecha_termino_maximo: Optional[date] = None
    plantilla_id: Optional[str] = None
    observaciones: Optional[str] = None
    # Campos de costos (el bot envía comuna_grupo_id desde la sesión)
    dias_estimados: Optional[int] = Field(default=None, ge=1)
    cantidad_trabajadores: Optional[int] = Field(default=None, ge=1)
    comuna_grupo_id: Optional[str] = None
    porcentaje_ganancia: Optional[Decimal] = Field(default=None, ge=0)
    precio_dia_trabajador: Optional[Decimal] = Field(default=None, ge=0)
    materiales: List[dict]  # [{"material_id": "...", "cantidad_planeada": 5}, ...]