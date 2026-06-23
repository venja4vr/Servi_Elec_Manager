from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.usuario import (
    LoginRequest,
    TokenResponse,
    VerifyPasswordRequest,
    VerifyPasswordResponse,
)
from app.services.usuario_service import login, verify_password_for_user
from app.utils.auth import get_current_user


router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=TokenResponse)
def iniciar_sesion(data: LoginRequest, db: Session = Depends(get_db)):
    return login(db, data)


@router.post("/verify-password", response_model=VerifyPasswordResponse)
def verificar_password(
    data: VerifyPasswordRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Verifica la contraseña del usuario autenticado.
    Se usa antes de ejecutar acciones críticas.
    Si la contraseña es incorrecta, devuelve 401.
    """
    verificado = verify_password_for_user(
        db,
        current_user["id_usuario"],
        data.password
    )
    if not verificado:
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")
    return VerifyPasswordResponse(verified=True)