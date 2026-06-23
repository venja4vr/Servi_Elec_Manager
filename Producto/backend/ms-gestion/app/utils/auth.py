from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.usuario import Usuario

SECRET_KEY = "servielec-clave-secreta-2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200  # 30 días (necesario para token del bot)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
http_bearer = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),
    db: Session = Depends(get_db),
):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id: str = payload.get("sub")
        rol: str = payload.get("rol")
        if usuario_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        if db.query(Usuario).filter(Usuario.id_usuario == usuario_id).first() is None:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return {"id_usuario": usuario_id, "rol": rol}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user["rol"] not in ("A", "S"):
        raise HTTPException(status_code=403, detail="Se requieren permisos de administrador")
    return current_user

def require_superadmin(current_user: dict = Depends(get_current_user)):
    if current_user["rol"] != "S":
        raise HTTPException(status_code=403, detail="Solo el SuperAdmin puede realizar esta acción")
    return current_user