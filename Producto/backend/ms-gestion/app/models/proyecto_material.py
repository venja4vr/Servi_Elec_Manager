import uuid
from sqlalchemy import Column, String, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class ProyectoMaterial(Base):
    __tablename__ = "proyecto_material"

    id_pm                   = Column(String(32), primary_key=True, default=lambda: uuid.uuid4().hex)
    proyecto_id             = Column(String(20), ForeignKey("proyecto.id_proyecto"), nullable=False)
    # nullable para materiales externos nuevos (no existen en el inventario)
    material_id             = Column(String(20), ForeignKey("material.id_material"), nullable=True)
    cantidad_planeada       = Column(Numeric(9, 2), nullable=False)
    externo                 = Column(Boolean, nullable=False, default=False)
    nombre_material_externo = Column(String(200), nullable=True)
    precio_unitario_externo = Column(Numeric(12, 2), nullable=True)

    proyecto = relationship("Proyecto", backref="materiales_planeados")
    material = relationship("Material", backref="proyectos_planeados", foreign_keys=[material_id])
