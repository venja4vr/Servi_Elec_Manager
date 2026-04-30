from sqlalchemy import Column, String, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import date
import uuid

class Proyecto(Base):
    __tablename__ = "proyecto"

    id_proyecto            = Column(String(20), primary_key=True, default=lambda: uuid.uuid4().hex[:20])
    nombre_proyecto        = Column(String(50), nullable=False)
    tipo_proyecto          = Column(String(25), nullable=True)
    nombre_cliente         = Column(String(50), nullable=False)
    fecha_inicio           = Column(Date, nullable=True, default=date.today)
    estado                 = Column(String(10), nullable=False, default="pendiente")
    presupuesto_estimado   = Column(Numeric(9, 2), nullable=True)
    presupuesto_final      = Column(Numeric(9, 2), nullable=True)
    fecha_termino_maximo   = Column(Date, nullable=True)
    PLANTILLA_id_plantilla = Column(String(20), ForeignKey("plantilla.id_plantilla"), nullable=True)

    plantilla = relationship("Plantilla", backref="proyectos")