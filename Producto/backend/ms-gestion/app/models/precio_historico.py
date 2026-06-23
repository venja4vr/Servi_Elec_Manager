from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.db.database import Base
import uuid


class MaterialPrecioHistorico(Base):
    __tablename__ = "material_precio_historico"

    id_pmh      = Column(String(32), primary_key=True, default=lambda: uuid.uuid4().hex)
    material_id = Column(String(20), ForeignKey("material.id_material", ondelete="CASCADE"), nullable=False)
    precio      = Column(Numeric(12, 2), nullable=False)
    fuente      = Column(String(20), nullable=False)
    tienda      = Column(String(20), nullable=True, default="Sodimac")
    es_outlier  = Column(Boolean, nullable=False, default=False)
    fecha       = Column(DateTime, nullable=False, server_default=func.now())
