from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.controllers import categoria_controller
from app.schemas.categoria import CategoriaCreate, CategoriaOut

router = APIRouter(prefix="/categorias", tags=["Categorías"])

@router.get("/", response_model=List[CategoriaOut])
def listar(db: Session = Depends(get_db)):
    return categoria_controller.get_all(db)

@router.get("/{categoria_id}", response_model=CategoriaOut)
def obtener(categoria_id: str, db: Session = Depends(get_db)):
    return categoria_controller.get_one(db, categoria_id)

@router.post("/", response_model=CategoriaOut, status_code=201)
def crear(data: CategoriaCreate, db: Session = Depends(get_db)):
    return categoria_controller.create(db, data)

@router.delete("/{categoria_id}")
def eliminar(categoria_id: str, db: Session = Depends(get_db)):
    return categoria_controller.delete(db, categoria_id)