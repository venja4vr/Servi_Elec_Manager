from sqlalchemy import Column, String, Boolean, DateTime, func
from app.db.database import Base


class CategoriaPlantilla(Base):
    __tablename__ = "categoria_plantilla"

    id_categoria   = Column(String(32), primary_key=True)
    nombre         = Column(String(80), unique=True, nullable=False)
    activa         = Column(Boolean, nullable=False, default=True, server_default="true")
    fecha_creacion = Column(DateTime, server_default=func.now())
