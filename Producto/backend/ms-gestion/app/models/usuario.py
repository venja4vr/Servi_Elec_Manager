from sqlalchemy import Column, String
from app.db.database import Base
import uuid

class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario     = Column(String(15), primary_key=True, default=lambda: uuid.uuid4().hex[:15])
    nombre_usuario = Column(String(50), nullable=False)
    correo         = Column(String(40), nullable=False, unique=True)
    password_hash  = Column(String(255), nullable=False)
    rol            = Column(String(1), nullable=False, default="A")