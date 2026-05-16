from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.usuario import UsuarioCreate, UsuarioOut
from app.services.usuario_service import (
    crear_usuario,
    listar_usuarios,
    listar_usuarios_pendientes,
    aprobar_usuario,
    rechazar_usuario,
)
from app.utils.auth import require_admin, require_superadmin

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.post("/", response_model=UsuarioOut, status_code=201)
def crear(data: UsuarioCreate, db: Session = Depends(get_db)):
    return crear_usuario(db, data)


@router.get("/", response_model=List[UsuarioOut])
def listar(db: Session = Depends(get_db), _=Depends(require_admin)):
    return listar_usuarios(db)


@router.get("/pendientes", response_model=List[UsuarioOut])
def listar_pendientes(db: Session = Depends(get_db), _=Depends(require_superadmin)):
    return listar_usuarios_pendientes(db)


@router.patch("/{usuario_id}/aprobar", response_model=UsuarioOut)
def aprobar(
    usuario_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_superadmin),
):
    return aprobar_usuario(db, usuario_id)


@router.delete("/{usuario_id}")
def rechazar(
    usuario_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_superadmin),
):
    return rechazar_usuario(db, usuario_id)