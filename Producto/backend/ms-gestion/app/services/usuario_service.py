from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, LoginRequest
from app.utils.auth import hash_password, verify_password, create_access_token


def crear_usuario(db: Session, data: UsuarioCreate):
    if db.query(Usuario).filter(Usuario.correo == data.correo).first():
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    usuario = Usuario(
        nombre_usuario=data.nombre_usuario,
        correo=data.correo,
        password_hash=hash_password(data.password),
        rol=data.rol,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def login(db: Session, data: LoginRequest):
    usuario = db.query(Usuario).filter(Usuario.correo == data.correo).first()
    if not usuario or not verify_password(data.password, usuario.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos"
        )
    token = create_access_token({
        "sub": usuario.id_usuario,
        "rol": usuario.rol
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario_id": usuario.id_usuario,
        "nombre": usuario.nombre_usuario,
        "rol": usuario.rol,
    }


def listar_usuarios(db: Session):
    return db.query(Usuario).all()

def verify_password_for_user(db: Session, usuario_id: str, password: str) -> bool:
    """
    Verifica que la contraseña coincida con la del usuario indicado.
    Usado para confirmar acciones críticas (eliminar, cambiar estado, etc.)
    """
    usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if not usuario:
        return False
    return verify_password(password, usuario.password_hash)