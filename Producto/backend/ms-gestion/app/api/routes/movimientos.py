from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.controllers import movimiento_controller
from app.schemas.movimiento import MovimientoCreate, MovimientoOut
from app.utils.auth import get_current_user, require_admin

router = APIRouter(prefix="/movimientos", tags=["Movimientos"])

@router.get("/", response_model=List[MovimientoOut])
def listar(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return movimiento_controller.get_all(db)

@router.get("/proyecto/{proyecto_id}", response_model=List[MovimientoOut])
def listar_por_proyecto(proyecto_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return movimiento_controller.get_by_proyecto(db, proyecto_id)

@router.post("/", response_model=MovimientoOut, status_code=201)
def registrar(
    data: MovimientoCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    return movimiento_controller.create(db, data, current_user["id_usuario"])