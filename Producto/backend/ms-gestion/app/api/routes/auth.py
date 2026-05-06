from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.usuario import LoginRequest, TokenResponse
from app.services.usuario_service import login

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=TokenResponse)
def iniciar_sesion(data: LoginRequest, db: Session = Depends(get_db)):
    return login(db, data)