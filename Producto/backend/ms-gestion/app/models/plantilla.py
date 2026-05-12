from sqlalchemy import Column, String, Text, Numeric
from app.db.database import Base
import uuid


class Plantilla(Base):
    __tablename__ = "plantilla"

    id_plantilla         = Column(String(20), primary_key=True, default=lambda: uuid.uuid4().hex[:20])
    nombre_servicio      = Column(String(60), nullable=False)
    descripcion          = Column(String(200), nullable=True)
    materiales_sugeridos = Column(Text, nullable=True)
    precio_estimado      = Column(Numeric(9, 2), nullable=True)