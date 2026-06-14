from datetime import datetime
from pydantic import BaseModel


class NotificacionCreate(BaseModel):
    usuario_id: str
    tipo: str
    titulo: str
    mensaje: str


class NotificacionOut(BaseModel):
    id_notificacion: str
    usuario_id: str
    tipo: str
    titulo: str
    mensaje: str
    leida: bool
    creada_en: datetime

    model_config = {"from_attributes": True}
