from sqlalchemy import Column, String, Integer, Text
from app.db.database import Base


class ComunaGrupo(Base):
    __tablename__ = "comuna_grupo"

    id_cg         = Column(String(32), primary_key=True)
    nombre        = Column(String(80), nullable=False)
    descripcion   = Column(Text, nullable=True)
    rango_km_min  = Column(Integer, nullable=False)
    rango_km_max  = Column(Integer, nullable=False)
    precio_por_km = Column(Integer, nullable=False)
