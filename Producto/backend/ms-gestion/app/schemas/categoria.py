from pydantic import BaseModel

class CategoriaCreate(BaseModel):
    nombre_categoria: str

class CategoriaOut(BaseModel):
    id_categoria: str
    nombre_categoria: str

    class Config:
        from_attributes = True