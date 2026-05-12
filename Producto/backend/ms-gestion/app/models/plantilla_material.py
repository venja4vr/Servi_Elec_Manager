from sqlalchemy import Column, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class PlantillaMaterial(Base):
    __tablename__ = "plantilla_material"

    plantilla_id      = Column(String(20), ForeignKey("plantilla.id_plantilla"), primary_key=True)
    material_id       = Column(String(20), ForeignKey("material.id_material"), primary_key=True)
    cantidad_sugerida = Column(Numeric(9, 2), nullable=False)
    unidad            = Column(String(15), nullable=False)

    plantilla = relationship("Plantilla", backref="materiales_vinculados")
    material  = relationship("Material", backref="plantillas_vinculadas")