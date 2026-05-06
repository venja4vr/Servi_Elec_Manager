from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.controllers import plantilla_controller
from app.schemas.plantilla import PlantillaCreate, PlantillaUpdate, PlantillaOut

router = APIRouter(prefix="/plantillas", tags=["Plantillas"])

@router.get("/", response_model=List[PlantillaOut])
def listar(db: Session = Depends(get_db)):
    return plantilla_controller.get_all(db)

@router.get("/{plantilla_id}", response_model=PlantillaOut)
def obtener(plantilla_id: str, db: Session = Depends(get_db)):
    return plantilla_controller.get_one(db, plantilla_id)

@router.post("/", response_model=PlantillaOut, status_code=201)
def crear(data: PlantillaCreate, db: Session = Depends(get_db)):
    return plantilla_controller.create(db, data)

@router.put("/{plantilla_id}", response_model=PlantillaOut)
def actualizar(plantilla_id: str, data: PlantillaUpdate, db: Session = Depends(get_db)):
    return plantilla_controller.update(db, plantilla_id, data)

@router.delete("/{plantilla_id}")
def eliminar(plantilla_id: str, db: Session = Depends(get_db)):
    return plantilla_controller.delete(db, plantilla_id)