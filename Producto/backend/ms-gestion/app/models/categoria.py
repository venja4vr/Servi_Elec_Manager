from sqlalchemy import Column, String
from app.db.database import Base
import uuid

class Categoria(Base):
    __tablename__ = "categoria"

    id_categoria     = Column(String(20), primary_key=True, default=lambda: uuid.uuid4().hex[:20])
    nombre_categoria = Column(String(50), nullable=False)