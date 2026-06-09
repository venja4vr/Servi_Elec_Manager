from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field, model_validator


class MaterialPlaneado(BaseModel):
    material_id: str
    cantidad_planeada: Decimal


class ProyectoMaterialOut(BaseModel):
    id_pm: str
    proyecto_id: str
    material_id: Optional[str] = None
    cantidad_planeada: Decimal
    externo: bool = False

    class Config:
        from_attributes = True


class MaterialPlaneadoDetalle(BaseModel):
    id_pm: str
    material_id: Optional[str] = None
    nombre_material: str
    cantidad_planeada: Decimal
    stock_actual: Optional[int] = None
    precio_unitario: Optional[Decimal] = None
    suficiente_stock: bool
    externo: bool = False
    es_externo_nuevo: bool = False

    class Config:
        from_attributes = True


# ── Payloads ──────────────────────────────────────────────────────────────────

class AgregarMaterialProyecto(BaseModel):
    # Opción A: material del inventario
    material_id: Optional[str] = None
    externo: bool = False
    # Opción B: material externo nuevo (no existe en inventario)
    nombre_externo: Optional[str] = None
    precio_externo: Optional[Decimal] = Field(default=None, ge=0)
    # Común
    cantidad: Decimal = Field(..., gt=0)

    @model_validator(mode="after")
    def validar_tipo(self):
        tiene_inventario = bool(self.material_id)
        tiene_externo_nuevo = bool(self.nombre_externo and self.nombre_externo.strip())
        if tiene_inventario and tiene_externo_nuevo:
            raise ValueError("No se puede especificar material_id y nombre_externo al mismo tiempo")
        if not tiene_inventario and not tiene_externo_nuevo:
            raise ValueError("Se debe indicar material_id (inventario) o nombre_externo (externo nuevo)")
        return self


class ActualizarMaterialProyecto(BaseModel):
    cantidad: Decimal = Field(..., gt=0)
    ajustar_stock: bool = False
