from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.models.usuario import Usuario
import uuid

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

class UsuarioCreate(BaseModel):
    nombre_usuario: str
    correo: str
    password: str

@router.post("/", status_code=201)
def crear_usuario(data: UsuarioCreate, db: Session = Depends(get_db)):
    u = Usuario(
        nombre_usuario=data.nombre_usuario,
        correo=data.correo,
        password_hash=data.password,
        rol="A"
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return {"id_usuario": u.id_usuario, "nombre_usuario": u.nombre_usuario}