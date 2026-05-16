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
        rol="A",
        estado="pendiente",
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
    if usuario.estado == "pendiente":
        raise HTTPException(
            status_code=403,
            detail="Tu cuenta está pendiente de aprobación por el administrador"
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


def listar_usuarios_pendientes(db: Session):
    return db.query(Usuario).filter(Usuario.estado == "pendiente").all()

def listar_usuarios_activos(db: Session):
    return db.query(Usuario).filter(Usuario.estado == "aprobado").all()


def aprobar_usuario(db: Session, usuario_id: str):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if usuario.estado == "aprobado":
        raise HTTPException(status_code=400, detail="El usuario ya está aprobado")
    usuario.estado = "aprobado"
    db.commit()
    db.refresh(usuario)
    return usuario


def rechazar_usuario(db: Session, usuario_id: str):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if usuario.rol == "S":
        raise HTTPException(status_code=400, detail="No se puede eliminar a un SuperAdmin")
    nombre = usuario.nombre_usuario
    db.delete(usuario)
    db.commit()
    return {"mensaje": f"Usuario {nombre} eliminado correctamente"}


def verify_password_for_user(db: Session, usuario_id: str, password: str) -> bool:
    """
    Verifica que la contraseña coincida con la del usuario indicado.
    Usado para confirmar acciones críticas (eliminar, cambiar estado, etc.)
    """
    usuario = db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first()
    if not usuario:
        return False
    return verify_password(password, usuario.password_hash)