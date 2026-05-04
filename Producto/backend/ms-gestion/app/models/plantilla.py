from sqlalchemy import Column, String, Text
from app.db.database import Base
import uuid

class Plantilla(Base):
    __tablename__ = "plantilla"

    id_plantilla         = Column(String(20), primary_key=True, default=lambda: uuid.uuid4().hex[:20])
    nombre_servicio      = Column(String(50), nullable=False)
    descripcion          = Column(String(200), nullable=True)
    materiales_sugeridos = Column(Text, nullable=True)