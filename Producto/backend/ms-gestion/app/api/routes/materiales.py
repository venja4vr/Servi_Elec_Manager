from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.controllers import material_controller
from app.schemas.material import MaterialCreate, MaterialUpdate, MaterialOut

router = APIRouter(prefix="/materiales", tags=["Materiales"])

@router.get("/", response_model=List[MaterialOut])
def listar(solo_criticos: bool = Query(False), db: Session = Depends(get_db)):
    return material_controller.get_all(db, solo_criticos)

@router.get("/{material_id}", response_model=MaterialOut)
def obtener(material_id: str, db: Session = Depends(get_db)):
    return material_controller.get_one(db, material_id)

@router.post("/", response_model=MaterialOut, status_code=201)
def crear(data: MaterialCreate, db: Session = Depends(get_db)):
    return material_controller.create(db, data)

@router.put("/{material_id}", response_model=MaterialOut)
def actualizar(material_id: str, data: MaterialUpdate, db: Session = Depends(get_db)):
    return material_controller.update(db, material_id, data)

@router.delete("/{material_id}")
def eliminar(material_id: str, db: Session = Depends(get_db)):
    return material_controller.delete(db, material_id)

@router.patch("/{material_id}/stock")
def ajustar_stock(material_id: str, cantidad: int = Query(..., description="Positivo para ingresar, negativo para retirar"), db: Session = Depends(get_db)):
    return material_controller.ajustar_stock(db, material_id, cantidad)