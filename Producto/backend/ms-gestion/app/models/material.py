from sqlalchemy import Column, String, Integer, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid

class Material(Base):
    __tablename__ = "material"

    id_material            = Column(String(20), primary_key=True, default=lambda: uuid.uuid4().hex[:20])
    nombre_material        = Column(String(50), nullable=False)
    descripcion            = Column(String(250), nullable=True)
    stock_actual           = Column(Integer, nullable=False, default=0)
    stock_critico          = Column(Integer, nullable=False, default=0)
    precio_unitario        = Column(Numeric(9, 2), nullable=False, default=0)
    CATEGORIA_id_categoria = Column(String(20), ForeignKey("categoria.id_categoria"), nullable=False)

    categoria = relationship("Categoria", backref="materiales")

    @property
    def stock_bajo(self):
        return self.stock_actual <= self.stock_critico