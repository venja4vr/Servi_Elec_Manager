import uuid
from sqlalchemy import Column, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base


class Notificacion(Base):
    __tablename__ = "notificacion"

    id_notificacion = Column(String(15), primary_key=True, default=lambda: uuid.uuid4().hex[:15])
    usuario_id      = Column(String(15), ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False)
    tipo            = Column(String(50), nullable=False)
    titulo          = Column(String(200), nullable=False)
    mensaje         = Column(Text, nullable=False)
    leida           = Column(Boolean, nullable=False, default=False)
    creada_en       = Column(DateTime, nullable=False, server_default=func.now())
