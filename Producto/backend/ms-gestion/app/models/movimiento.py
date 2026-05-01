from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime
import uuid

class Movimiento(Base):
    __tablename__ = "movimiento"

    id_movimiento        = Column(String(100), primary_key=True, default=lambda: uuid.uuid4().hex)
    cantidad             = Column(Integer, nullable=False)
    fecha_salida         = Column(DateTime, nullable=False, default=datetime.utcnow)
    PROYECTO_id_proyecto = Column(String(20), ForeignKey("proyecto.id_proyecto"), nullable=False)
    MATERIAL_id_material = Column(String(20), ForeignKey("material.id_material"), nullable=False)
    USUARIO_id_usuario   = Column(String(15), ForeignKey("usuario.id_usuario"), nullable=False)

    proyecto = relationship("Proyecto", backref="movimientos")
    material = relationship("Material", backref="movimientos")
    usuario  = relationship("Usuario", backref="movimientos")