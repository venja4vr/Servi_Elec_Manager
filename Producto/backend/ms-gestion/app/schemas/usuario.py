from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional


class UsuarioCreate(BaseModel):
    nombre_usuario: str = Field(..., min_length=3, max_length=80)
    correo: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    rol: Optional[str] = "A"

    @field_validator("nombre_usuario")
    @classmethod
    def limpiar_nombre(cls, v):
        return v.strip()

    @field_validator("rol")
    @classmethod
    def validar_rol(cls, v):
        if v not in ("A", "S"):
            raise ValueError("El rol debe ser A (Administrador) o S (SuperAdmin)")
        return v


class UsuarioOut(BaseModel):
    id_usuario: str
    nombre_usuario: str
    correo: str
    rol: str
    estado: str

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    correo: EmailStr
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario_id: str
    nombre: str
    rol: str


class VerifyPasswordRequest(BaseModel):
    password: str = Field(..., min_length=1)


class VerifyPasswordResponse(BaseModel):
    verified: bool


class AprobarUsuarioResponse(BaseModel):
    id_usuario: str
    nombre_usuario: str
    correo: str
    rol: str
    estado: str
    mensaje: str

    class Config:
        from_attributes = True
