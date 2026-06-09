from sqlalchemy import Column, String, Text, Numeric, Boolean
from app.db.database import Base
import uuid


class Plantilla(Base):
    __tablename__ = "plantilla"

    id_plantilla         = Column(String(20), primary_key=True, default=lambda: uuid.uuid4().hex[:20])
    nombre_servicio      = Column(String(60), nullable=False)
    descripcion          = Column(String(200), nullable=True)
    materiales_sugeridos = Column(Text, nullable=True)
    precio_estimado      = Column(Numeric(9, 2), nullable=True)
    categoria            = Column(String(40), nullable=True)
    activa               = Column(Boolean, nullable=False, default=True, server_default="true")

    @property
    def num_materiales(self) -> int:
        if "materiales_vinculados" in self.__dict__:
            return len(self.__dict__["materiales_vinculados"])
        try:
            return len(self.materiales_vinculados)
        except Exception:
            return 0
