from sqlalchemy import Column, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class ProyectoMaterial(Base):
    __tablename__ = "proyecto_material"

    proyecto_id       = Column(String(20), ForeignKey("proyecto.id_proyecto"), primary_key=True)
    material_id       = Column(String(20), ForeignKey("material.id_material"), primary_key=True)
    cantidad_planeada = Column(Numeric(9, 2), nullable=False)

    proyecto = relationship("Proyecto", backref="materiales_planeados")
    material = relationship("Material", backref="proyectos_planeados")