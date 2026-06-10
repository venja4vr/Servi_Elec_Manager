from sqlalchemy import Column, String, Date, Numeric, Integer, ForeignKey
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
    telefono_cliente       = Column(String(20), nullable=True)
    direccion_cliente      = Column(String(150), nullable=True)
    fecha_inicio           = Column(Date, nullable=True, default=date.today)
    estado                 = Column(String(10), nullable=False, default="pendiente")
    presupuesto_estimado   = Column(Numeric(9, 2), nullable=True)
    presupuesto_final      = Column(Numeric(9, 2), nullable=True)
    fecha_termino_maximo   = Column(Date, nullable=True)
    plantilla_id           = Column(String(20), ForeignKey("plantilla.id_plantilla"), nullable=True)
    observaciones          = Column(String(500), nullable=True)

    # Campos de costos (Sprint Precios)
    dias_estimados         = Column(Integer, nullable=True, default=1)
    cantidad_trabajadores  = Column(Integer, nullable=True, default=1)
    comuna_grupo_id        = Column(String(32), ForeignKey("comuna_grupo.id_cg"), nullable=True)
    porcentaje_ganancia    = Column(Numeric(5, 2), nullable=True, default=15.00)
    precio_dia_trabajador  = Column(Numeric(10, 2), nullable=True, default=60000.00)

    plantilla    = relationship("Plantilla", backref="proyectos")
    comuna_grupo = relationship("ComunaGrupo", backref="proyectos")