from pydantic import BaseModel
from typing import Optional


class UsuarioCreate(BaseModel):
    nombre_usuario: str
    correo: str
    password: str
    rol: Optional[str] = "A"


class UsuarioOut(BaseModel):
    id_usuario: str
    nombre_usuario: str
    correo: str
    rol: str

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    correo: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario_id: str
    nombre: str
    rol: str


class VerifyPasswordRequest(BaseModel):
    password: str


class VerifyPasswordResponse(BaseModel):
    verified: bool